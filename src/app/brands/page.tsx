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
import { Award, Plus, Pencil, Trash2 } from "lucide-react";

export default function BrandsPage() {
  const { activeBranchId } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    description: "",
  });

  const loadData = async () => {
    const res = await fetch(`/api/brands?idCabang=${activeBranchId}`);
    const json = await res.json();
    if (json.success) setItems(json.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/brands", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: activeBranchId,
          name: form.name,
          description: form.description,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Brand updated!" : "Brand created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/brands?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Moved "${deleteTarget.name}" to Trash`);
      setDeleteTarget(null);
      loadData();
    } else {
      toast.error(json.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    await Promise.all(
      selected.map((row) =>
        fetch(`/api/brands?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${selected.length} brand(s) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Brand Name",
      cell: ({ row }) => (
        <span className="font-semibold text-xs">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: "Linked Products",
      cell: ({ row }) => (
        <Badge variant="info" className="font-mono text-xs">
          {row.original.productCount || 0} items
        </Badge>
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
                name: row.original.name,
                description: row.original.description || "",
              });
              setModalOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-amber-500" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Product Brands
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage manufacturer brands (e.g. Bandai Spirits, Mr. Hobby, GodHand,
            Tamiya)
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ id: 0, name: "", description: "" });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Brand
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search brand name or description..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Brand to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Brand" : "Create Brand"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Brand Name *</Label>
              <Input
                placeholder="e.g. Bandai Spirits (Blue Logo)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional brand details..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
                Save Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
