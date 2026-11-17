"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
  Boxes,
  Truck,
  Barcode,
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  X,
  FileCheck2,
  Building2,
  Receipt,
  ScanLine,
} from "lucide-react";

interface StockInItemRow {
  productId: string;
  qty: number;
  costPrice: number;
}

const COMMON_SUPPLIERS = [
  "LITT TAK SDN. BHD.",
  "Bandai Namco Asia Distributor",
  "Maxsoft Sdn Bhd",
  "Toy Panic Sdn Bhd",
  "Gundam Malaysia Warehouse",
  "Direct Import (Japan)",
];

export default function StockInPage() {
  const { activeBranchId } = useAppStore();
  const [stockIns, setStockIns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStockIn, setSelectedStockIn] = useState<any | null>(null);
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState<string>("");
  const [docViewerTitle, setDocViewerTitle] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Form State
  const [supplier, setSupplier] = useState("LITT TAK SDN. BHD.");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [note, setNote] = useState("");
  const [invoiceFile, setInvoiceFile] = useState("");
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const [itemRows, setItemRows] = useState<StockInItemRow[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [siRes, pRes] = await Promise.all([
        fetch(`/api/stock-in?idCabang=${activeBranchId}`),
        fetch(`/api/products?idCabang=${activeBranchId}`),
      ]);
      const [siJson, pJson] = await Promise.all([siRes.json(), pRes.json()]);
      if (siJson.success) setStockIns(siJson.data || []);
      if (pJson.success) setProducts(pJson.data || []);
    } catch {
      toast.error("Failed to load inventory data");
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const openNewStockInModal = () => {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setReferenceNo(`STK-${todayStr}-${randomSuffix}`);
    setSupplier("LITT TAK SDN. BHD.");
    setInvoiceNo("");
    setNote("");
    setInvoiceFile("");
    setInvoiceFileName("");
    setBarcodeInput("");

    // Initialize with 1 empty item or first product
    if (products.length > 0) {
      setItemRows([
        {
          productId: String(products[0].id),
          qty: 1,
          costPrice: Number(products[0].price || 0),
        },
      ]);
    } else {
      setItemRows([]);
    }
    setModalOpen(true);
  };

  // Barcode / SKU quick-add
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const matched = products.find(
      (p) =>
        p.productCode?.toLowerCase() === query ||
        p.name?.toLowerCase().includes(query)
    );

    if (!matched) {
      toast.error(`No product found matching "${query}"`);
      return;
    }

    const existingIndex = itemRows.findIndex(
      (it) => it.productId === String(matched.id)
    );

    if (existingIndex >= 0) {
      const updated = [...itemRows];
      updated[existingIndex].qty += 1;
      setItemRows(updated);
      toast.success(`Incremented quantity for "${matched.name}" (+1)`);
    } else {
      setItemRows((prev) => [
        ...prev,
        {
          productId: String(matched.id),
          qty: 1,
          costPrice: Number(matched.price || 0),
        },
      ]);
      toast.success(`Added "${matched.name}" to restock list`);
    }

    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    // Pick the first product not yet in itemRows if possible
    const existingIds = new Set(itemRows.map((it) => it.productId));
    const nextProduct = products.find((p) => !existingIds.has(String(p.id))) || products[0];

    setItemRows((prev) => [
      ...prev,
      {
        productId: String(nextProduct.id),
        qty: 1,
        costPrice: Number(nextProduct.price || 0),
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (itemRows.length <= 1) {
      toast.warning("Stock-in must have at least one product item");
      return;
    }
    setItemRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof StockInItemRow,
    value: any
  ) => {
    setItemRows((prev) => {
      const updated = [...prev];
      if (field === "productId") {
        const prod = products.find((p) => String(p.id) === String(value));
        updated[index] = {
          ...updated[index],
          productId: String(value),
          costPrice: prod ? Number(prod.price || 0) : updated[index].costPrice,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  // Upload Invoice Document (photo / PDF)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPG, PNG, WEBP) or PDF file");
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setInvoiceFile(json.url);
      setInvoiceFileName(file.name);
      toast.success(`Uploaded invoice: "${file.name}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim()) {
      toast.error("Please enter supplier name");
      return;
    }

    if (itemRows.length === 0) {
      toast.error("Please add at least one product item to restock");
      return;
    }

    for (let i = 0; i < itemRows.length; i++) {
      const it = itemRows[i];
      if (!it.productId) {
        toast.error(`Row #${i + 1}: Please select a product`);
        return;
      }
      if (it.qty <= 0) {
        toast.error(`Row #${i + 1}: Quantity must be greater than 0`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCabang: activeBranchId,
          referenceNo,
          invoiceNo: invoiceNo.trim(),
          supplier: supplier.trim(),
          invoiceFile,
          invoiceFileName,
          note: note.trim(),
          items: itemRows.map((it) => ({
            productId: Number(it.productId),
            qty: Number(it.qty),
            costPrice: Number(it.costPrice || 0),
          })),
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      toast.success(
        `Successfully recorded stock in with ${itemRows.length} item(s)!`
      );
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save stock-in");
    } finally {
      setSubmitting(false);
    }
  };

  // Deletion
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

  // Calculations for form summary
  const formTotalItems = itemRows.length;
  const formTotalQty = useMemo(
    () => itemRows.reduce((acc, r) => acc + Number(r.qty || 0), 0),
    [itemRows]
  );
  const formTotalCost = useMemo(
    () =>
      itemRows.reduce(
        (acc, r) => acc + Number(r.qty || 0) * Number(r.costPrice || 0),
        0
      ),
    [itemRows]
  );

  // Overall KPI
  const totalUnitsReceived = useMemo(
    () => stockIns.reduce((acc, r) => acc + Number(r.qty || 0), 0),
    [stockIns]
  );
  const totalAmountReceived = useMemo(
    () => stockIns.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0),
    [stockIns]
  );

  const openDocumentViewer = (url: string, title: string) => {
    setDocViewerUrl(url);
    setDocViewerTitle(title);
    setDocViewerOpen(true);
  };

  const isPdf = (url: string) => url?.toLowerCase().endsWith(".pdf");

  // Columns definition
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "referenceNo",
      header: "Ref & Invoice No",
      cell: ({ row }) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-xs text-blue-600 block">
            {row.original.referenceNo}
          </span>
          {row.original.invoiceNo ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              <Receipt className="h-3 w-3 text-slate-500" />
              Inv: {row.original.invoiceNo}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 italic">No Inv #</span>
          )}
        </div>
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
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 max-w-[200px]">
          <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="font-bold text-xs text-slate-900 truncate">
            {row.original.supplier || "Supplier"}
          </span>
        </div>
      ),
    },
    {
      id: "itemsList",
      header: "Incoming Products",
      cell: ({ row }) => {
        const items = row.original.items || [];
        const count = items.length;
        if (count === 0) {
          return <span className="text-xs text-slate-400">-</span>;
        }

        const previewItem = items[0];
        const remaining = count - 1;

        return (
          <div className="max-w-[260px] space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-bold shrink-0">
                {count} SKU{count > 1 ? "s" : ""}
              </Badge>
              <span className="font-bold text-xs text-slate-800 truncate">
                {previewItem.productName}
              </span>
              <span className="text-[11px] font-mono text-emerald-600 font-bold shrink-0">
                +{previewItem.qty}
              </span>
            </div>
            {remaining > 0 && (
              <p className="text-[10px] text-slate-500">
                +{remaining} other product{remaining > 1 ? "s" : ""}...
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "qty",
      header: "Total Units",
      cell: ({ row }) => (
        <Badge variant="success" className="font-mono text-xs px-2.5 py-0.5">
          +{row.original.qty} pcs
        </Badge>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Cost",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-slate-800">
          {Number(row.original.totalAmount) > 0
            ? formatRM(row.original.totalAmount)
            : "-"}
        </span>
      ),
    },
    {
      id: "document",
      header: "Invoice Doc",
      cell: ({ row }) => {
        const fileUrl = row.original.invoiceFile;
        if (!fileUrl) {
          return <span className="text-xs text-slate-400 italic">No Doc</span>;
        }

        const pdf = isPdf(fileUrl);
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openDocumentViewer(
                fileUrl,
                `Invoice Document: ${row.original.invoiceNo || row.original.referenceNo}`
              )
            }
            className="h-7 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
          >
            {pdf ? (
              <FileText className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
            )}
            <span>{pdf ? "PDF Doc" : "View Photo"}</span>
          </Button>
        );
      },
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
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-blue-200 text-blue-600 hover:bg-blue-50"
            title="View Details"
            onClick={() => {
              setSelectedStockIn(row.original);
              setDetailsModalOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-red-100 hover:bg-red-50"
            title="Move to Trash"
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900">
            <PackagePlus className="h-6 w-6 text-primary" />
            Product Stock In (Multiple Items & Invoices)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record supplier deliveries with multiple product items, supplier invoice numbers, and attached invoice photos/PDFs
          </p>
        </div>
        <Button
          onClick={openNewStockInModal}
          variant="mecha"
          className="font-bold shadow-md h-10 px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Record Stock In
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              Active incoming stock shipments
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

        <Card className="border-blue-200 bg-gradient-to-br from-white to-purple-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Restock Value
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-purple-700">
              {formatRM(totalAmountReceived)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total supplier invoice procurement
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-indigo-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Catalog SKUs
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
        searchPlaceholder="Search by reference no, invoice no, supplier, or product..."
        onBulkDelete={handleBulkDelete}
      />

      {/* Move to Trash Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Stock-In Record to Trash?"
        itemName={deleteTarget?.referenceNo}
        description={
          deleteTarget
            ? `Moving this record to Trash will revert and deduct ${deleteTarget.qty} pcs from active inventory across all associated products.`
            : undefined
        }
        onConfirm={confirmSingleDelete}
      />

      {/* ============================================================== */}
      {/* MULTI-PRODUCT & INVOICE STOCK IN MODAL                        */}
      {/* ============================================================== */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-blue-200">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <PackagePlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-base font-extrabold text-white">
                    Incoming Stock & Supplier Invoice Restock
                  </DialogTitle>
                  <DialogDescription className="text-xs text-blue-100 mt-0.5">
                    Batch restock multiple product items from supplier delivery, enter invoice details, and attach document
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-slate-50/50">
            {/* Top Section: Supplier & Invoice Metadata */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Supplier & Invoice Information
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Ref: {referenceNo}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Name with suggestions */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Supplier / Distributor Name *</span>
                  </Label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. LITT TAK SDN. BHD."
                    className="h-9 border-blue-200 bg-blue-50/30 text-xs font-medium"
                    required
                  />
                  {/* Quick supplier chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_SUPPLIERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSupplier(s)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          supplier === s
                            ? "bg-blue-600 text-white border-blue-600 font-bold"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Supplier Invoice / SO Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Supplier Invoice / Sales Order No.
                  </Label>
                  <Input
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="e.g. SOE 81198412 / INV-9901"
                    className="h-9 border-blue-200 bg-blue-50/30 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    Document number printed on supplier receipt / delivery order
                  </p>
                </div>
              </div>

              {/* Document Upload Zone */}
              <div className="pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Upload Invoice Document (Photo or PDF)
                </Label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                />

                {invoiceFile ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        {isPdf(invoiceFile) ? (
                          <FileText className="h-5 w-5 text-red-600" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 truncate">
                          {invoiceFileName || "Uploaded Invoice Document"}
                        </div>
                        <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <FileCheck2 className="h-3 w-3" />
                          Ready & Attached
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openDocumentViewer(
                            invoiceFile,
                            `Preview: ${invoiceFileName}`
                          )
                        }
                        className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInvoiceFile("");
                          setInvoiceFileName("");
                        }}
                        className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      uploadingDoc ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {uploadingDoc
                          ? "Uploading document..."
                          : "Click to upload invoice photo (JPG, PNG) or PDF"}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Take a photo of the paper receipt from the supplier or upload a digital PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Section: Multiple Product Items */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Product Items Received ({itemRows.length})
                  </h3>
                </div>

                {/* Barcode scanner quick add input */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ScanLine className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      ref={barcodeInputRef}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleBarcodeSubmit();
                        }
                      }}
                      placeholder="Scan barcode or type SKU..."
                      className="h-8 pl-8 text-xs w-48 sm:w-64 border-blue-200 bg-blue-50/20 font-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleBarcodeSubmit()}
                    className="h-8 text-xs border-blue-200 text-blue-700"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Table of items */}
              <div className="space-y-3">
                {itemRows.map((row, idx) => {
                  const productObj = products.find(
                    (p) => String(p.id) === String(row.productId)
                  );
                  const currentStock = productObj ? Number(productObj.stock) : 0;
                  const newStock = currentStock + Number(row.qty || 0);
                  const subtotal = Number(row.qty || 0) * Number(row.costPrice || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white shadow-2xs space-y-3 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-800">
                            Product Item #{idx + 1}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Product selection (6 cols) */}
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Select Product *
                          </Label>
                          <Select
                            value={row.productId}
                            onValueChange={(val) =>
                              handleItemChange(idx, "productId", val)
                            }
                          >
                            <SelectTrigger className="w-full h-9 border-blue-200 bg-blue-50/20 text-xs">
                              <SelectValue placeholder="Choose product..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {products.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={String(p.id)}
                                  className="text-xs"
                                >
                                  [{p.productCode}] {p.name} (Stock: {p.stock})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {productObj && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                              <span>Stock: {currentStock} pcs</span>
                              <span className="text-blue-600 font-bold">
                                → New: {newStock} pcs
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Incoming Qty (3 cols) */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Incoming Qty (pcs) *
                          </Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "qty",
                                  Math.max(1, parseInt(e.target.value) || 0)
                                )
                              }
                              className="h-9 font-mono font-bold text-xs text-center border-blue-200"
                              required
                            />
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(idx, "qty", Number(row.qty || 0) + 1)
                                }
                                className="h-4 w-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded flex items-center justify-center"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleItemChange(
                                    idx,
                                    "qty",
                                    Math.max(1, Number(row.qty || 0) - 1)
                                  )
                                }
                                className="h-4 w-5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded flex items-center justify-center"
                              >
                                -
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Unit Cost / Buy Price (2 cols) */}
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Unit Cost (RM)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.costPrice}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "costPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="h-9 font-mono text-xs border-blue-200"
                          />
                        </div>

                        {/* Subtotal (2 cols) */}
                        <div className="sm:col-span-2 space-y-1 text-right">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Subtotal
                          </Label>
                          <div className="h-9 flex items-center justify-end font-mono font-extrabold text-xs text-blue-700">
                            {formatRM(subtotal)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add item button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                className="w-full border-dashed border-blue-300 text-blue-700 hover:bg-blue-50/60 font-bold text-xs h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Another Product Item
              </Button>
            </div>

            {/* Bottom Summary & Notes */}
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Remarks / Delivery Notes
                  </Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. PO No. 60633 - 1 CTN - Received in good condition"
                    className="h-20 text-xs border-blue-200"
                  />
                </div>

                {/* Batch Totals Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Batch Restock Summary
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Distinct Products:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formTotalItems} SKU{formTotalItems > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Total Incoming Units:</span>
                    <span className="font-bold font-mono text-emerald-700">
                      +{formTotalQty} pcs
                    </span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      Total Invoice Amount:
                    </span>
                    <span className="font-extrabold font-mono text-base text-blue-700">
                      {formatRM(formTotalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="mecha"
                disabled={submitting}
                className="h-10 px-6 font-bold text-xs shadow-md"
              >
                {submitting ? "Saving & Restocking..." : "Confirm & Restock Inventory"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DETAILS VIEW MODAL (INVOICE & ITEM BREAKDOWN)                  */}
      {/* ============================================================== */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-blue-200">
          {selectedStockIn && (
            <div>
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-extrabold text-white">
                        Stock In Details: {selectedStockIn.referenceNo}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-blue-100">
                        Recorded on {formatDateTime(selectedStockIn.createdAt)} by{" "}
                        {selectedStockIn.userName}
                      </DialogDescription>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 bg-white">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Supplier
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedStockIn.supplier || "Supplier"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Invoice / SO No.
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedStockIn.invoiceNo || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Total Units
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      +{selectedStockIn.qty} pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Total Amount
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {formatRM(selectedStockIn.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Attached Document Banner */}
                {selectedStockIn.invoiceFile && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/60">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        {isPdf(selectedStockIn.invoiceFile) ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {selectedStockIn.invoiceFileName || "Supplier Invoice Document"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isPdf(selectedStockIn.invoiceFile)
                            ? "PDF Document"
                            : "Invoice Photo"}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        openDocumentViewer(
                          selectedStockIn.invoiceFile,
                          `Invoice: ${selectedStockIn.invoiceNo || selectedStockIn.referenceNo}`
                        )
                      }
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Document
                    </Button>
                  </div>
                )}

                {/* Products Received Table */}
                <div className="space-y-2">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Received Product Items ({(selectedStockIn.items || []).length})
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">No.</th>
                          <th className="py-2.5 px-3">Product Name & Code</th>
                          <th className="py-2.5 px-3 text-center">Incoming Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Cost</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(selectedStockIn.items || []).map((it: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900">
                                {it.productName}
                              </div>
                              <div className="text-[10px] font-mono text-blue-600">
                                #{it.productCode}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <Badge
                                variant="success"
                                className="font-mono text-xs px-2 py-0.5"
                              >
                                +{it.qty} pcs
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {Number(it.costPrice) > 0
                                ? formatRM(it.costPrice)
                                : "-"}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {Number(it.subtotal) > 0
                                ? formatRM(it.subtotal)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedStockIn.note && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">
                      Notes:
                    </span>
                    <p className="text-slate-600">{selectedStockIn.note}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <Button
                  variant="outline"
                  onClick={() => setDetailsModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DOCUMENT VIEWER MODAL (PHOTO LIGHTBOX & PDF VIEWER)           */}
      {/* ============================================================== */}
      <Dialog open={docViewerOpen} onOpenChange={setDocViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden border-slate-300">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold truncate">
              {isPdf(docViewerUrl) ? (
                <FileText className="h-4 w-4 text-red-400" />
              ) : (
                <ImageIcon className="h-4 w-4 text-blue-400" />
              )}
              <span>{docViewerTitle || "Invoice Document Viewer"}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={docViewerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-white font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Open External
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDocViewerOpen(false)}
                className="h-7 w-7 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[400px] max-h-[80vh] overflow-auto">
            {isPdf(docViewerUrl) ? (
              <iframe
                src={docViewerUrl}
                title={docViewerTitle}
                className="w-full h-[70vh] rounded-lg border-0 bg-white"
              />
            ) : (
              <img
                src={docViewerUrl}
                alt={docViewerTitle}
                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
