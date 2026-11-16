"use client";

import React, { useEffect, useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
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
import { formatDateTime, formatRM } from "@/lib/utils";
import { toast } from "sonner";
import {
  PackagePlus,
  Plus,
  Trash2,
  ArrowRight,
  Boxes,
  Truck,
  Barcode,
  CheckCircle2,
} from "lucide-react";

export default function StockInPage() {
  const { activeBranchId } = useAppStore();
  const [stockIns, setStockIns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("10");
  const [supplier, setSupplier] = useState("Bandai Namco Asia Distributor");
  const [note, setNote] = useState("");

  const loadData = async () => {
    const [siRes, pRes] = await Promise.all([
      fetch(`/api/stock-in?idCabang=${activeBranchId}`),
      fetch(`/api/products?idCabang=${activeBranchId}`),
    ]);
    const [siJson, pJson] = await Promise.all([siRes.json(), pRes.json()]);
    if (siJson.success) setStockIns(siJson.data || []);
    if (pJson.success) setProducts(pJson.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || Number(qty) <= 0) {
      toast.error(
        "Please select an existing product and enter a valid quantity"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCabang: activeBranchId,
          productId: Number(productId),
          qty: Number(qty),
          supplier,
          note,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Added +${qty} units into inventory!`);
      setModalOpen(false);
      setNote("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/stock-in?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success("Stock-in record moved to Trash & stock adjusted");
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    try {
      await Promise.all(
        selected.map((row) =>
          fetch(`/api/stock-in?id=${row.id}`, { method: "DELETE" })
        )
      );
      toast.success(`Moved ${selected.length} stock-in record(s) to Trash`);
      loadData();
    } catch {
      toast.error("Failed to move some records to Trash");
    }
  };

  const totalUnitsReceived = useMemo(
    () => stockIns.reduce((acc, r) => acc + Number(r.qty || 0), 0),
    [stockIns]
  );

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "referenceNo",
      header: "Ref No",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.original.referenceNo}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product Item",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <img
            src={row.original.productImage || "/images/gundam/rx78.svg"}
            alt={row.original.productName}
            className="h-10 w-12 rounded-lg object-cover border border-blue-100 bg-slate-950 shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate max-w-[240px]">
              {row.original.productName}
            </div>
            <div className="text-[10px] font-mono text-blue-600">
              #{row.original.productCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "qty",
      header: "Incoming Qty",
      cell: ({ row }) => (
        <Badge variant="success" className="font-mono text-xs px-2.5 py-0.5">
          +{row.original.qty} pcs
        </Badge>
      ),
    },
    {
      id: "stockMovement",
      header: "Stock Balance",
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg">
          <span className="text-slate-500">{row.original.previousStock}</span>
          <ArrowRight className="h-3 w-3 text-blue-600" />
          <span className="font-extrabold text-blue-700">
            {row.original.newStock} pcs
          </span>
        </div>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier / Note",
      cell: ({ row }) => (
        <div className="text-xs max-w-[220px]">
          <div className="font-semibold text-slate-800 truncate">
            {row.original.supplier || "-"}
          </div>
          {row.original.note && (
            <div className="text-[11px] text-slate-500 truncate">
              {row.original.note}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "userName",
      header: "Recorded By",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-slate-700">
          {row.original.userName}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-red-100 hover:bg-red-50"
          onClick={() => setDeleteTarget(row.original)}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      ),
    },
  ];

  const selectedProductObj = products.find(
    (p) => String(p.id) === String(productId)
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            <PackagePlus className="h-6 w-6 text-primary" />
            Product Stock In (Incoming Inventory)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an existing product item and record incoming restock
            quantities for this branch
          </p>
        </div>
        <Button
          onClick={() => {
            setProductId(products[0]?.id ? String(products[0].id) : "");
            setQty("10");
            setModalOpen(true);
          }}
          variant="mecha"
          className="font-bold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1" />
          Record Stock In
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Restock Batches
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {stockIns.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active incoming stock deliveries
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-emerald-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Units Added
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <PackagePlus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              +{totalUnitsReceived} pcs
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cumulative incoming stock units
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-indigo-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Branch Catalog
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-indigo-700">
              {products.length} SKUs
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Available products ready for restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={stockIns}
        searchPlaceholder="Search by reference no, product name, barcode, or supplier..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Stock-In Record to Trash?"
        itemName={deleteTarget?.referenceNo}
        description={
          deleteTarget
            ? `Moving this record to Trash will deduct ${deleteTarget.qty} pcs from "${deleteTarget.productName}".`
            : undefined
        }
        onConfirm={confirmSingleDelete}
      />

      {/* Responsive & Clean Stock In Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-blue-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <PackagePlus className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-extrabold text-white">
                  Record Incoming Product Stock
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Search and select an existing product to add incoming stock
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white min-w-0">
            <div className="space-y-1.5 min-w-0">
              <Label className="text-slate-700">
                Select Existing Product *
              </Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="w-full h-10 border-blue-200 bg-blue-50/30">
                  <SelectValue placeholder="Search & choose product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={String(p.id)}
                      className="text-xs"
                    >
                      [{p.productCode}] {p.name} (Stock: {p.stock} pcs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Product Visual Preview Card */}
            {selectedProductObj && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedProductObj.image || "/images/gundam/rx78.svg"}
                    alt={selectedProductObj.name}
                    className="h-12 w-14 rounded-lg object-cover border border-blue-200 bg-slate-950 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedProductObj.name}
                    </p>
                    <p className="text-[11px] font-mono text-blue-600 flex items-center gap-1 mt-0.5">
                      <Barcode className="h-3 w-3" />
                      {selectedProductObj.productCode} •{" "}
                      {formatRM(selectedProductObj.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shrink-0">
                  <div className="text-center">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Current
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {selectedProductObj.stock}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                  <div className="text-center">
                    <span className="block text-[9px] uppercase font-bold text-emerald-600">
                      New Total
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-600">
                      {Number(selectedProductObj.stock) +
                        Math.max(0, Number(qty || 0))}{" "}
                      pcs
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-slate-700">
                  Incoming Quantity (Units) *
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="font-mono font-bold text-base h-10 border-blue-200"
                  required
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[5, 10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQty(String(preset))}
                      className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-[10px] font-bold border border-blue-200 transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700">Supplier / Source</Label>
                <Input
                  placeholder="e.g. Bandai Namco Asia"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="h-10 border-blue-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700">Restock Note (Optional)</Label>
              <Textarea
                placeholder="Delivery order number or batch remarks..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="border-blue-200"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-blue-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="mecha" disabled={submitting}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {submitting ? "Recording..." : "Confirm Stock In"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
