"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { PosWorkspace } from "@/components/pos/pos-workspace";
import { formatRM, formatDateTime } from "@/lib/utils";
import { printReceiptInline } from "@/lib/pdf-printer";
import { toast } from "sonner";
import { Eye, Printer, Pencil, Trash2, Receipt, User } from "lucide-react";

export default function TransactionsPage() {
  const { activeBranchId, user, settings } = useAppStore();
  const [transactions, setTransactions] = useState<any[]>([]);

  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/transactions?idCabang=${activeBranchId}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data || []);
      }
    } catch {
      toast.error("Failed to load transactions");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeBranchId]);

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/transactions?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Transaction ${deleteTarget.invoiceNo} moved to Trash`);
      setDeleteTarget(null);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    try {
      await Promise.all(
        selected.map((tx) =>
          fetch(`/api/transactions?id=${tx.id}`, { method: "DELETE" })
        )
      );
      toast.success(`Moved ${selected.length} transaction(s) to Trash`);
      fetchTransactions();
    } catch {
      toast.error("Failed to move some transactions to Trash");
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: ({ row }) => (
        <div className="font-mono font-bold text-xs text-primary">
          {row.original.invoiceNo}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date & Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-semibold flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            {row.original.customerName || "Walk-in Customer"}
          </div>
          {row.original.customerPhone && (
            <div className="text-[10px] font-mono text-muted-foreground">
              {row.original.customerPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "cashierName",
      header: "Cashier",
      cell: ({ row }) => (
        <span className="text-xs font-medium">{row.original.cashierName}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => {
        const m = String(row.original.paymentMethod).toLowerCase();
        return (
          <Badge
            variant={
              m === "cash" ? "success" : m === "split" ? "warning" : "info"
            }
            className="uppercase font-mono text-[10px]"
          >
            {m.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "grossTotal",
      header: "Gross (RM)",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {formatRM(row.original.grossTotal)}
        </span>
      ),
    },
    {
      accessorKey: "discountTotal",
      header: "Discount (RM)",
      cell: ({ row }) => {
        const tx = row.original;
        const itemDisc = Number(tx.itemDiscountTotal || 0);
        const ordDisc = Number(tx.orderDiscountAmount || 0);
        const totalDisc = Number(tx.discountTotal || 0);
        return (
          <div className="font-mono text-xs">
            <div className="font-bold text-emerald-600">
              -{formatRM(totalDisc)}
            </div>
            {(itemDisc > 0 || ordDisc > 0) && (
              <div className="text-[10px] text-slate-500">
                {itemDisc > 0 ? `Item: -${formatRM(itemDisc)}` : ""}
                {itemDisc > 0 && ordDisc > 0 ? " • " : ""}
                {ordDisc > 0 ? `Receipt: -${formatRM(ordDisc)}` : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "netTotal",
      header: "Net Total (RM)",
      cell: ({ row }) => (
        <span className="font-mono font-extrabold text-xs text-foreground">
          {formatRM(row.original.netTotal)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="View Receipt Details"
              onClick={() => {
                setSelectedTx(tx);
                setReceiptOpen(true);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Print Receipt Inline"
              onClick={() => printReceiptInline(tx, settings)}
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Edit Transaction (POS Mode)"
              onClick={() => {
                setEditingTx(tx);
                setEditModalOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5 text-amber-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Move Transaction to Trash"
              onClick={() => setDeleteTarget(tx)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Transaction List
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.role === "employee"
              ? `Showing transactions processed by you (${user.name})`
              : "Manage, view receipts, edit items/prices/discounts, or move transactions to Trash"}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchPlaceholder="Search by invoice no, customer, cashier, or payment method..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Transaction to Trash?"
        itemName={deleteTarget?.invoiceNo}
        description="Product stock from this transaction will be automatically returned to branch inventory."
        onConfirm={confirmSingleDelete}
      />

      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={selectedTx}
      />

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1350px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction — {editingTx?.invoiceNo}</DialogTitle>
            <DialogDescription>
              Modify items, quantities, custom unit prices, discounts (% or RM),
              customer, or payment method. Stock is automatically reconciled.
            </DialogDescription>
          </DialogHeader>
          {editingTx && (
            <PosWorkspace
              editingTransaction={editingTx}
              onEditSuccess={(updated) => {
                setEditModalOpen(false);
                setEditingTx(null);
                fetchTransactions();
                setSelectedTx(updated);
                setReceiptOpen(true);
              }}
              onCancelEdit={() => {
                setEditModalOpen(false);
                setEditingTx(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
