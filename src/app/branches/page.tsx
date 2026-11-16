"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";

export default function BranchesPage() {
  const { setBranches } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    code: "",
    name: "",
    address: "",
    phone: "",
    isMain: false,
  });

  const loadData = async () => {
    const res = await fetch("/api/branches");
    const json = await res.json();
    if (json.success) {
      setItems(json.data || []);
      setBranches(json.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/branches", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Branch updated!" : "New branch created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/branches?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Branch "${deleteTarget.name}" moved to Trash`);
      setDeleteTarget(null);
      loadData();
    } else {
      toast.error(json.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    const deletable = selected.filter((b) => !b.isMain);
    if (deletable.length === 0) {
      toast.error("Cannot move the main HQ branch to Trash");
      return;
    }
    await Promise.all(
      deletable.map((row) =>
        fetch(`/api/branches?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${deletable.length} branch(es) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "ID Cabang",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "code",
      header: "Branch Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Branch Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs">{row.original.name}</span>
          {Boolean(row.original.isMain) && (
            <Badge variant="info" className="text-[10px]">
              HQ Main
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.phone || "-"}</span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.address || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setForm({
                id: row.original.id,
                code: row.original.code,
                name: row.original.name,
                address: row.original.address || "",
                phone: row.original.phone || "",
                isMain: Boolean(row.original.isMain),
              });
              setModalOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-amber-500" />
          </Button>
          {!row.original.isMain && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Master Branches (Multi-Branch Management)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Every master record and transaction is linked to its respective
            branch ID (id_cabang)
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              id: 0,
              code: `BR-0${items.length + 1}`,
              name: "",
              address: "",
              phone: "+60 ",
              isMain: false,
            });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Branch
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search branch code, name, or address..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Branch to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Branch" : "Create New Branch"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Branch Name *</Label>
              <Input
                placeholder="e.g. Gundam Base Kuala Lumpur HQ"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                placeholder="+60 3-2148 8899"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="mecha">
                Save Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
