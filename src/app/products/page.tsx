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
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  BarcodeLabelItem,
  generateCode128Svg,
  printBarcodeLabelsInline,
  downloadBarcodeLabelsPdf,
} from "@/lib/barcode-printer";
import { formatRM, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Barcode,
  Upload,
  Wand2,
  ImageIcon,
  AlertTriangle,
  Boxes,
  Printer,
  Download,
  CheckCircle2,
  Filter,
  RotateCcw,
} from "lucide-react";

export default function ProductsPage() {
  const { activeBranchId, user } = useAppStore();
  const isStockAdmin = user?.role === "admin_stok";
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Interactive Card Filter: "all" | "low" | "healthy"
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "healthy">(
    "all"
  );

  // Category, Sub-Category, Brand Filters (default "all")
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSubCategory, setFilterSubCategory] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  // Barcode Print State (Single or Bulk)
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeLabelItem[]>([]);

  const [form, setForm] = useState({
    id: 0,
    idCabang: activeBranchId,
    productCode: "",
    name: "",
    image: "/images/gundam/rx78.svg",
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    stock: "0",
    price: "",
  });

  const loadData = async () => {
    const [pRes, cRes, scRes, bRes] = await Promise.all([
      fetch(`/api/products?idCabang=${activeBranchId}`),
      fetch(`/api/categories?idCabang=${activeBranchId}`),
      fetch(`/api/sub-categories?idCabang=${activeBranchId}`),
      fetch(`/api/brands?idCabang=${activeBranchId}`),
    ]);
    const [pJson, cJson, scJson, bJson] = await Promise.all([
      pRes.json(),
      cRes.json(),
      scRes.json(),
      bRes.json(),
    ]);
    if (pJson.success) setProducts(pJson.data || []);
    if (cJson.success) setCategories(cJson.data || []);
    if (scJson.success) setSubCategories(scJson.data || []);
    if (bJson.success) setBrands(bJson.data || []);
  };

  useEffect(() => {
    setFilterCategory("all");
    setFilterSubCategory("all");
    setFilterBrand("all");
    setStockFilter("all");
    loadData();
  }, [activeBranchId]);

  // Sub-category options inside Create/Edit modal (dependent on form.categoryId)
  const filteredSubCategories = useMemo(() => {
    if (!form.categoryId) return [];
    return subCategories.filter(
      (sc) => String(sc.categoryId) === String(form.categoryId)
    );
  }, [subCategories, form.categoryId]);

  // Sub-category options for the Table Filter Bar (dependent on filterCategory)
  const filterBarSubCategories = useMemo(() => {
    if (filterCategory === "all") return subCategories;
    return subCategories.filter(
      (sc) => String(sc.categoryId) === String(filterCategory)
    );
  }, [subCategories, filterCategory]);

  // Products matching Category, Sub-Category, and Brand filters
  const catalogFilteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        filterCategory !== "all" &&
        String(p.categoryId) !== String(filterCategory)
      ) {
        return false;
      }
      if (
        filterSubCategory !== "all" &&
        String(p.subCategoryId) !== String(filterSubCategory)
      ) {
        return false;
      }
      if (filterBrand !== "all" && String(p.brandId) !== String(filterBrand)) {
        return false;
      }
      return true;
    });
  }, [products, filterCategory, filterSubCategory, filterBrand]);

  // Metrics calculated from the filtered catalog
  const metrics = useMemo(() => {
    const totalProducts = catalogFilteredProducts.length;
    const totalStockUnits = catalogFilteredProducts.reduce(
      (acc, p) => acc + Number(p.stock || 0),
      0
    );
    const lowStockList = catalogFilteredProducts.filter(
      (p) => Number(p.stock) <= 10
    );
    const healthyStockList = catalogFilteredProducts.filter(
      (p) => Number(p.stock) > 10
    );
    return {
      totalProducts,
      totalStockUnits,
      lowStockCount: lowStockList.length,
      healthyCount: healthyStockList.length,
    };
  }, [catalogFilteredProducts]);

  // Final displayed products combining Category/SubCategory/Brand + Stock Status Card filter
  const displayedProducts = useMemo(() => {
    if (stockFilter === "low") {
      return catalogFilteredProducts.filter((p) => Number(p.stock) <= 10);
    }
    if (stockFilter === "healthy") {
      return catalogFilteredProducts.filter((p) => Number(p.stock) > 10);
    }
    return catalogFilteredProducts;
  }, [catalogFilteredProducts, stockFilter]);

  const handleOpenCreate = () => {
    const defaultCat = categories[0]?.id ? String(categories[0].id) : "";
    const matchingSub = subCategories.find(
      (sc) => String(sc.categoryId) === defaultCat
    );
    setForm({
      id: 0,
      idCabang: activeBranchId,
      productCode: `4573102${Math.floor(100000 + Math.random() * 900000)}`,
      name: "",
      image: "/images/gundam/rx78.svg",
      categoryId: defaultCat,
      subCategoryId: matchingSub ? String(matchingSub.id) : "",
      brandId: brands[0]?.id ? String(brands[0].id) : "",
      stock: "10",
      price: "95.00",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setForm({
      id: prod.id,
      idCabang: prod.idCabang,
      productCode: prod.productCode,
      name: prod.name,
      image: prod.image || "/images/gundam/rx78.svg",
      categoryId: String(prod.categoryId),
      subCategoryId: String(prod.subCategoryId),
      brandId: String(prod.brandId),
      stock: String(prod.stock),
      price: String(prod.price),
    });
    setModalOpen(true);
  };

  const handleOpenSingleBarcode = (prod: any) => {
    setBarcodeItems([
      {
        productCode: prod.productCode,
        name: prod.name,
        price: prod.price,
        copies: 1,
      },
    ]);
    setBarcodeModalOpen(true);
  };

  const handleOpenBulkBarcode = (selected: any[]) => {
    setBarcodeItems(
      selected.map((p) => ({
        productCode: p.productCode,
        name: p.name,
        price: p.price,
        copies: 1,
      }))
    );
    setBarcodeModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setForm((prev) => ({ ...prev, image: json.url }));
      toast.success("Product photo uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.subCategoryId || !form.brandId) {
      toast.error("Please select Category, Sub-Category, and Brand");
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: activeBranchId,
          productCode: form.productCode,
          name: form.name,
          image: form.image,
          categoryId: Number(form.categoryId),
          subCategoryId: Number(form.subCategoryId),
          brandId: Number(form.brandId),
          stock: Number(form.stock),
          price: Number(form.price),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Product updated!" : "Product created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Moved "${deleteTarget.name}" to Trash`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    try {
      await Promise.all(
        selected.map((item) =>
          fetch(`/api/products?id=${item.id}`, { method: "DELETE" })
        )
      );
      toast.success(`Moved ${selected.length} product(s) to Trash`);
      loadData();
    } catch {
      toast.error("Failed to move some items to Trash");
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "image",
      header: "Photo",
      cell: ({ row }) => (
        <img
          src={row.original.image || "/images/gundam/rx78.svg"}
          alt={row.original.name}
          className="h-11 w-14 rounded-lg object-cover border border-blue-100 bg-slate-950"
        />
      ),
    },
    {
      accessorKey: "productCode",
      header: "Product Code / Barcode",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
          <Barcode className="h-3.5 w-3.5" />
          {row.original.productCode}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <div className="font-semibold text-xs max-w-[260px]">
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category / Sub-Category",
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium">{row.original.categoryName}</div>
          <div className="text-[11px] text-muted-foreground">
            {row.original.subCategoryName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "brandName",
      header: "Brand",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[11px]">
          {row.original.brandName}
        </Badge>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const s = Number(row.original.stock);
        return (
          <Badge
            variant={s <= 0 ? "destructive" : s <= 10 ? "warning" : "success"}
            className="font-mono text-xs"
          >
            {s} pcs
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Unit Price (RM)",
      cell: ({ row }) => (
        <span className="font-mono font-extrabold text-xs">
          {formatRM(row.original.price)}
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
            className="h-8 w-8 border-blue-200 hover:bg-blue-50"
            title="Print Barcode Sticker"
            onClick={() => handleOpenSingleBarcode(row.original)}
          >
            <Barcode className="h-3.5 w-3.5 text-blue-600" />
          </Button>
          {!isStockAdmin && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Edit Product"
                onClick={() => handleOpenEdit(row.original)}
              >
                <Pencil className="h-3.5 w-3.5 text-amber-500" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Move to Trash"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const hasActiveDropdownFilter =
    filterCategory !== "all" ||
    filterSubCategory !== "all" ||
    filterBrand !== "all" ||
    stockFilter !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Product Catalog & Items
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Gunpla kits, print barcode stickers (single or bulk), and
            filter by Category, Sub-Category, Brand, or Stock Status
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="mecha">
          <Plus className="h-4 w-4 mr-1" />
          Add New Product
        </Button>
      </div>

      {/* Interactive Summary Filter Cards (Click to Filter Table) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setStockFilter("all")}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-blue-200 bg-gradient-to-br from-white to-blue-50/70",
            stockFilter === "all" && "ring-2 ring-blue-600 border-blue-600"
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products (All Items)
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {metrics.totalProducts} SKUs
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Total Stock: {metrics.totalStockUnits} pcs</span>
              {stockFilter === "all" && (
                <Badge className="bg-blue-600 text-white text-[10px] py-0">
                  Active Filter
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() =>
            setStockFilter(stockFilter === "low" ? "all" : "low")
          }
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-amber-200 bg-gradient-to-br from-white to-amber-50/70",
            stockFilter === "low" && "ring-2 ring-amber-500 border-amber-500"
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Low Stock Alert (≤ 10 pcs)
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-600">
              {metrics.lowStockCount} Items
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Click card to filter low stock items</span>
              {stockFilter === "low" && (
                <Badge variant="warning" className="text-[10px] py-0">
                  Filtering Low Stock
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() =>
            setStockFilter(stockFilter === "healthy" ? "all" : "healthy")
          }
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-emerald-200 bg-gradient-to-br from-white to-emerald-50/70",
            stockFilter === "healthy" &&
              "ring-2 ring-emerald-600 border-emerald-600"
          )}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Healthy Stock (&gt; 10 pcs)
            </CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {metrics.healthyCount} Items
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>Click card to filter ready stock</span>
              {stockFilter === "healthy" && (
                <Badge variant="success" className="text-[10px] py-0">
                  Filtering Healthy
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category, Sub-Category, and Brand Filter Bar (Defaults to All) */}
      <Card className="border-blue-100 bg-white shadow-2xs">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-blue-900">
                <Filter className="h-3 w-3 text-blue-600" />
                Filter Category
              </Label>
              <Select
                value={filterCategory}
                onValueChange={(val) => {
                  setFilterCategory(val);
                  setFilterSubCategory("all");
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-blue-900">Filter Sub-Category</Label>
              <Select
                value={filterSubCategory}
                onValueChange={setFilterSubCategory}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Sub-Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {filterBarSubCategories.map((sc) => (
                    <SelectItem key={sc.id} value={String(sc.id)}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-blue-900">Filter Brand</Label>
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveDropdownFilter && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={() => {
                setFilterCategory("all");
                setFilterSubCategory("all");
                setFilterBrand("all");
                setStockFilter("all");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={displayedProducts}
        searchPlaceholder="Search product name, barcode, grade, or brand..."
        onBulkDelete={isStockAdmin ? undefined : handleBulkDelete}
        onBulkPrintBarcode={handleOpenBulkBarcode}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Product to Trash?"
        itemName={deleteTarget?.name}
        onConfirm={confirmSingleDelete}
      />

      {/* Compact Barcode Sticker Preview & Print Modal (Single & Bulk) */}
      <Dialog open={barcodeModalOpen} onOpenChange={setBarcodeModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-blue-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Barcode className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-white">
                {barcodeItems.length === 1
                  ? "Print Product Barcode Sticker"
                  : `Bulk Print Barcode Stickers (${barcodeItems.length} Products)`}
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-100 mt-0.5">
                Compact 50mm x 30mm sticker with Product Name, Barcode, and RM
                Price
              </DialogDescription>
            </div>
          </div>

          <div className="p-5 space-y-4 bg-white max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barcodeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-dashed border-slate-300 p-3 bg-slate-50/60 flex flex-col items-center text-center space-y-1.5"
                >
                  <p className="text-[11px] font-extrabold text-slate-900 line-clamp-1 w-full">
                    {item.name}
                  </p>
                  <div
                    className="bg-white p-1.5 rounded border border-slate-200"
                    dangerouslySetInnerHTML={{
                      __html: generateCode128Svg(item.productCode, 145, 32),
                    }}
                  />
                  <span className="font-mono text-[10px] font-bold text-slate-700 tracking-wider">
                    {item.productCode}
                  </span>
                  <Badge className="bg-slate-900 text-white font-mono text-xs font-extrabold border-0">
                    {formatRM(item.price)}
                  </Badge>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200 w-full justify-center">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Copies:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.copies || 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value || 1));
                        setBarcodeItems((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, copies: val } : it
                          )
                        );
                      }}
                      className="w-14 h-6 text-center font-mono text-xs font-bold border border-blue-200 rounded bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-4 bg-blue-50/50 border-t border-blue-100 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadBarcodeLabelsPdf(barcodeItems)}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Save Barcode PDF
            </Button>
            <Button
              type="button"
              variant="mecha"
              size="sm"
              onClick={() => printBarcodeLabelsInline(barcodeItems)}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print Sticker (Inline)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Product Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Product Item" : "Create New Product Item"}
            </DialogTitle>
            <DialogDescription>
              Sub-category options dynamically update based on the selected
              Category.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
              <img
                src={form.image || "/images/gundam/rx78.svg"}
                alt="Preview"
                className="h-20 w-24 rounded-lg object-cover border border-blue-200 bg-slate-950 shrink-0"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Label className="text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                  Product Photo
                </Label>
                <p className="text-[11px] text-slate-500">
                  Upload a product image from your device (JPG, PNG, WEBP, SVG)
                </p>
                <div className="pt-1">
                  <Label
                    htmlFor="prod-img-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Uploading Photo..." : "Choose Photo File"}
                  </Label>
                  <input
                    id="prod-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Product Code / Barcode *</Label>
                <div className="flex gap-1.5">
                  <Input
                    value={form.productCode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        productCode: e.target.value,
                      }))
                    }
                    className="font-mono"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Generate EAN-13 Barcode"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        productCode: `4573102${Math.floor(100000 + Math.random() * 900000)}`,
                      }))
                    }
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Brand *</Label>
                <Select
                  value={form.brandId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, brandId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input
                placeholder="e.g. MG 1/100 RX-93 Nu Gundam Ver.Ka"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(val) => {
                    const firstSub = subCategories.find(
                      (sc) => String(sc.categoryId) === val
                    );
                    setForm((prev) => ({
                      ...prev,
                      categoryId: val,
                      subCategoryId: firstSub ? String(firstSub.id) : "",
                    }));
                  }}
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
                <Label>Sub-Category (Fetched by Category) *</Label>
                <Select
                  value={form.subCategoryId}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, subCategoryId: val }))
                  }
                  disabled={!form.categoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sub-Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubCategories.map((sc) => (
                      <SelectItem key={sc.id} value={String(sc.id)}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stock Quantity *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Unit Price (RM) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="font-mono font-bold"
                  required
                />
              </div>
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
                {form.id ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
