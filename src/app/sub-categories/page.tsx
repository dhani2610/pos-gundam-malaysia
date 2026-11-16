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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { toast } from "sonner";
import { GitBranch, Plus, Pencil, Trash2 } from "lucide-react";

export default function SubCategoriesPage() {
  const { activeBranchId } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    categoryId: "",
    name: "",
    description: "",
  });

  const loadData = async () => {
    const [scRes, cRes] = await Promise.all([
      fetch(`/api/sub-categories?idCabang=${activeBranchId}`),
      fetch(`/api/categories?idCabang=${activeBranchId}`),
    ]);
    const [scJson, cJson] = await Promise.all([scRes.json(), cRes.json()]);
    if (scJson.success) setItems(scJson.data || []);
    if (cJson.success) setCategories(cJson.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error("Please select a parent Category");
      return;
    }
    try {
      const res = await fetch("/api/sub-categories", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: activeBranchId,
          categoryId: Number(form.categoryId),
          name: form.name,
          description: form.description,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(
        form.id ? "Sub-Category updated!" : "Sub-Category created!"
      );
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/sub-categories?id=${deleteTarget.id}`, {
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
        fetch(`/api/sub-categories?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${selected.length} sub-category item(s) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Sub-Category Name (Grade / Type)",
      cell: ({ row }) => (
        <span className="font-semibold text-xs">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Parent Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50/50 text-blue-700">
          {row.original.categoryName}
        </Badge>
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
                categoryId: String(row.original.categoryId),
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
            <GitBranch className="h-6 w-6 text-primary" />
            Sub Categories (Grades & Types)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage sub-categories (e.g. HG 1/144, RG 1/144, MG 1/100, PG 1/60)
            linked to parent categories
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              id: 0,
              categoryId: categories[0]?.id ? String(categories[0].id) : "",
              name: "",
              description: "",
            });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Sub-Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search sub-category or parent category..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Sub-Category to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Sub-Category" : "Create Sub-Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Parent Category *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => setForm({ ...form, categoryId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub-Category Name *</Label>
              <Input
                placeholder="e.g. HG (High Grade 1/144)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional grade/type description..."
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
                Save Sub-Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
