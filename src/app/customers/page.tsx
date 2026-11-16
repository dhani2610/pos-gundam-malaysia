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
import { formatRM } from "@/lib/utils";
import { toast } from "sonner";
import { UserCheck, Plus, Pencil, Trash2, Phone, MapPin } from "lucide-react";

export default function CustomersPage() {
  const { activeBranchId } = useAppStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    phone: "",
    address: "",
  });

  const loadData = async () => {
    const res = await fetch(`/api/customers?idCabang=${activeBranchId}`);
    const json = await res.json();
    if (json.success) setCustomers(json.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: activeBranchId,
          name: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Customer updated!" : "Customer created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/customers?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`Customer "${deleteTarget.name}" moved to Trash`);
      setDeleteTarget(null);
      loadData();
    } else {
      toast.error(json.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    await Promise.all(
      selected.map((row) =>
        fetch(`/api/customers?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${selected.length} customer(s) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => (
        <span className="font-bold text-xs">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs flex items-center gap-1.5 text-primary">
          <Phone className="h-3 w-3" />
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address (Optional)",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          {row.original.address || "-"}
        </span>
      ),
    },
    {
      accessorKey: "totalTransactions",
      header: "Total Orders",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.totalTransactions || 0} orders
        </Badge>
      ),
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent (RM)",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-emerald-600">
          {formatRM(row.original.totalSpent)}
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
                name: row.original.name,
                phone: row.original.phone,
                address: row.original.address || "",
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
            <UserCheck className="h-6 w-6 text-primary" />
            Customer Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage store customers (linked with POS & Transactions)
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ id: 0, name: "", phone: "", address: "" });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search customer name, phone number, or address..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Customer to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Customer Full Name *</Label>
              <Input
                placeholder="e.g. Hathaway Noa"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                placeholder="e.g. +60 12-345 6789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address (Optional)</Label>
              <Textarea
                placeholder="Optional customer address..."
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
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
