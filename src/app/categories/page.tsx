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
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const { activeBranchId } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    code: "",
    name: "",
    description: "",
  });

  const loadData = async () => {
    const res = await fetch(`/api/categories?idCabang=${activeBranchId}`);
    const json = await res.json();
    if (json.success) setItems(json.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/categories", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: activeBranchId,
          code: form.code,
          name: form.name,
          description: form.description,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Category updated!" : "Category created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/categories?id=${deleteTarget.id}`, {
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
        fetch(`/api/categories?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${selected.length} category item(s) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Category Code",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Category Name",
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
      accessorKey: "subCategoryCount",
      header: "Sub-Categories",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.subCategoryCount || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "productCount",
      header: "Products",
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
                code: row.original.code,
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
            <Layers className="h-6 w-6 text-primary" />
            Category Items
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage primary product categories for this branch
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              id: 0,
              code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
              name: "",
              description: "",
            });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search category code, name, or description..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Category to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g. Gunpla Model Kits"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional category details..."
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
                Save Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
