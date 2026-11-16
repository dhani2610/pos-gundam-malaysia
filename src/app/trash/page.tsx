"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RestoreConfirmDialog,
  PermanentDeleteConfirmDialog,
} from "@/components/ui/delete-confirm-dialog";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, RotateCcw, UserX } from "lucide-react";

export default function TrashPage() {
  const { activeBranchId } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [permDeleteTarget, setPermDeleteTarget] = useState<any | null>(null);

  const loadTrash = async () => {
    const res = await fetch(`/api/trash?idCabang=${activeBranchId}`);
    const json = await res.json();
    if (json.success) setItems(json.data || []);
  };

  useEffect(() => {
    loadTrash();
  }, [activeBranchId]);

  const confirmSingleRestore = async () => {
    if (!restoreTarget) return;
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleKey: restoreTarget.moduleKey,
          id: restoreTarget.id,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(
        `Restored "${restoreTarget.title}" back to ${restoreTarget.moduleLabel}!`
      );
      setRestoreTarget(null);
      loadTrash();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSinglePermanentDelete = async () => {
    if (!permDeleteTarget) return;
    try {
      const res = await fetch("/api/trash", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleKey: permDeleteTarget.moduleKey,
          id: permDeleteTarget.id,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Permanently deleted "${permDeleteTarget.title}"`);
      setPermDeleteTarget(null);
      loadTrash();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkRestore = async (selected: any[]) => {
    try {
      await Promise.all(
        selected.map((row) =>
          fetch("/api/trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleKey: row.moduleKey,
              id: row.id,
            }),
          })
        )
      );
      toast.success(`Restored ${selected.length} item(s) from Trash!`);
      loadTrash();
    } catch {
      toast.error("Failed to restore some items");
    }
  };

  const handleBulkPermanentDelete = async (selected: any[]) => {
    try {
      await Promise.all(
        selected.map((row) =>
          fetch("/api/trash", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              moduleKey: row.moduleKey,
              id: row.id,
            }),
          })
        )
      );
      toast.success(`Permanently deleted ${selected.length} item(s)!`);
      loadTrash();
    } catch {
      toast.error("Failed to delete some items");
    }
  };

  const filteredItems =
    moduleFilter === "all"
      ? items
      : items.filter((i) => i.moduleKey === moduleFilter);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "moduleLabel",
      header: "Module",
      cell: ({ row }) => (
        <Badge variant="info" className="text-xs">
          {row.original.moduleLabel}
        </Badge>
      ),
    },
    {
      accessorKey: "code",
      header: "Code / Reference",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Record Name / Title",
      cell: ({ row }) => (
        <span className="font-semibold text-xs">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "deletedByName",
      header: "Removed By",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
          <UserX className="h-3.5 w-3.5" />
          {row.original.deletedByName || `User #${row.original.deletedBy || 1}`}
        </div>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Removed At",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDateTime(row.original.deletedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="mecha"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setRestoreTarget(row.original)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs bg-red-600 hover:bg-red-700"
            onClick={() => setPermDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
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
            <Trash2 className="h-6 w-6 text-destructive" />
            Trash Data (Recycle Bin)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View removed items across all modules, restore them back to active
            data, or permanently delete them.
          </p>
        </div>

        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[210px] h-9 text-xs">
            <SelectValue placeholder="Filter by Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="transactions">Transactions</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="categories">Categories</SelectItem>
            <SelectItem value="sub_categories">Sub Categories</SelectItem>
            <SelectItem value="brands">Brands</SelectItem>
            <SelectItem value="stock_ins">Stock In</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="branches">Branches</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        searchPlaceholder="Search trash items by name, code, module, or user..."
        onBulkRestore={handleBulkRestore}
        onBulkPermanentDelete={handleBulkPermanentDelete}
      />

      <RestoreConfirmDialog
        open={Boolean(restoreTarget)}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title="Restore Item from Trash?"
        itemName={restoreTarget?.title}
        moduleName={restoreTarget?.moduleLabel}
        onConfirm={confirmSingleRestore}
      />

      <PermanentDeleteConfirmDialog
        open={Boolean(permDeleteTarget)}
        onOpenChange={(o) => !o && setPermDeleteTarget(null)}
        title="Permanently Delete Item?"
        itemName={permDeleteTarget?.title}
        onConfirm={confirmSinglePermanentDelete}
      />
    </div>
  );
}
