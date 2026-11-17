"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { QuickCustomerModal } from "@/components/pos/quick-customer-modal";
import { formatRM } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Package,
  Building2,
  Coins,
} from "lucide-react";

export interface CartItem {
  productId: number;
  productCode: string;
  productName: string;
  image?: string;
  originalPrice: number;
  customPrice: number;
  customPriceInput?: string;
  qty: number;
  maxStock: number;
  discountType: "rm" | "percent";
  discountValue: number;
  discountInput?: string;
}

interface PosWorkspaceProps {
  editingTransaction?: any | null;
  onEditSuccess?: (updatedTx: any) => void;
  onCancelEdit?: () => void;
}

export function PosWorkspace({
  editingTransaction,
  onEditSuccess,
  onCancelEdit,
}: PosWorkspaceProps) {
  const { activeBranchId, settings } = useAppStore();
  const effectiveBranchId = editingTransaction?.idCabang || activeBranchId || 1;

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walk-in");

  // Additional Order / Total Discount (% or RM, supports sen like 0.60)
  const [orderDiscountType, setOrderDiscountType] = useState<"rm" | "percent">(
    "rm"
  );
  const [orderDiscountInput, setOrderDiscountInput] = useState<string>("");

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "transfer" | "qr_pay"
  >("cash");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [completedTx, setCompletedTx] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const barcodeRef = useRef<HTMLInputElement>(null);

  const loadPosBundle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos-bundle?idCabang=${effectiveBranchId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setCategories(json.data.categories || []);
        setSubCategories(json.data.subCategories || []);
        setBrands(json.data.brands || []);
        setCustomers(json.data.customers || []);

        const st = json.data.settings;
        if (st?.bankName) {
          setSelectedBank(
            `${st.bankName} - ${st.bankAccountNumber} (${st.bankAccountHolder})`
          );
        }
      }
    } catch {
      toast.error("Failed to load POS catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosBundle();
  }, [effectiveBranchId]);

  // Populate state when editing an existing transaction
  useEffect(() => {
    if (editingTransaction && products.length > 0) {
      const mappedItems: CartItem[] = (editingTransaction.items || []).map(
        (it: any) => {
          const foundProd = products.find((p) => p.id === it.productId);
          const currentStock =
            Number(foundProd?.stock || 0) + Number(it.qty || 0);
          const cPrice = Number(it.customPrice);
          const dVal = Number(it.discountValue ?? it.discountAmount ?? 0);
          return {
            productId: it.productId,
            productCode: it.productCode,
            productName: it.productName,
            image: foundProd?.image || "/images/gundam/rx78.svg",
            originalPrice: Number(it.originalPrice),
            customPrice: cPrice,
            customPriceInput: String(cPrice),
            qty: Number(it.qty),
            maxStock: currentStock,
            discountType: it.discountType === "percent" ? "percent" : "rm",
            discountValue: dVal,
            discountInput: dVal > 0 ? String(dVal) : "",
          };
        }
      );
      setCart(mappedItems);
      setSelectedCustomerId(
        editingTransaction.customerId
          ? String(editingTransaction.customerId)
          : "walk-in"
      );
      setOrderDiscountType(
        editingTransaction.orderDiscountType === "percent" ? "percent" : "rm"
      );
      const ordDiscVal = Number(editingTransaction.orderDiscountValue || 0);
      setOrderDiscountInput(ordDiscVal > 0 ? String(ordDiscVal) : "");
      setPaymentMethod(editingTransaction.paymentMethod || "cash");
      setCashAmount(String(editingTransaction.cashAmount || ""));
      setTransferAmount(String(editingTransaction.transferAmount || ""));
      if (editingTransaction.bankAccountInfo) {
        setSelectedBank(editingTransaction.bankAccountInfo);
      }
      setNotes(editingTransaction.notes || "");
    }
  }, [editingTransaction, products.length]);

  // Fast O(1) Barcode Map for instant hardware keyboard scanner lookup
  const barcodeMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of products) {
      map.set(String(p.productCode).trim().toLowerCase(), p);
    }
    return map;
  }, [products]);

  const addProductToCart = (product: any) => {
    const availStock = Number(product.stock || 0);
    if (availStock <= 0 && !editingTransaction) {
      toast.error(`"${product.name}" is out of stock in this branch!`);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id);
      if (existingIdx > -1) {
        const current = prev[existingIdx];
        if (current.qty + 1 > current.maxStock) {
          toast.warning(
            `Maximum available stock (${current.maxStock}) reached for "${product.name}"`
          );
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...current,
          qty: current.qty + 1,
        };
        return updated;
      }

      const unitPrice = Number(product.price);
      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.productCode,
          productName: product.name,
          image: product.image || "/images/gundam/rx78.svg",
          originalPrice: unitPrice,
          customPrice: unitPrice,
          customPriceInput: String(unitPrice),
          qty: 1,
          maxStock: Math.max(1, availStock),
          discountType: "rm",
          discountValue: 0,
          discountInput: "",
        },
      ];
    });
  };

  // Global Hardware Barcode Scanner (Keyboard Wedge) Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput && target !== barcodeRef.current) return;

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = "";
      }
      lastKeyTime = now;

      if (e.key === "Enter" && buffer.length >= 4) {
        const code = buffer.trim().toLowerCase();
        const matched = barcodeMap.get(code);
        if (matched) {
          e.preventDefault();
          addProductToCart(matched);
          setBarcodeInput("");
          toast.success(`Scanned: ${matched.name}`);
        }
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcodeMap]);

  const handleBarcodeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeInput.trim().toLowerCase();
    if (!clean) return;
    const matched =
      barcodeMap.get(clean) ||
      products.find(
        (p) =>
          String(p.productCode).toLowerCase().includes(clean) ||
          String(p.name).toLowerCase().includes(clean)
      );

    if (matched) {
      addProductToCart(matched);
      toast.success(`Added to cart: ${matched.name}`);
      setBarcodeInput("");
    } else {
      toast.error(`No product found matching barcode "${barcodeInput}"`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (
        selectedCategory !== "all" &&
        String(p.categoryId) !== selectedCategory
      ) {
        return false;
      }
      if (
        selectedSubCategory !== "all" &&
        String(p.subCategoryId) !== selectedSubCategory
      ) {
        return false;
      }
      if (selectedBrand !== "all" && String(p.brandId) !== selectedBrand) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(p.name).toLowerCase().includes(q) ||
          String(p.productCode).toLowerCase().includes(q) ||
          String(p.brandName || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    products,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    searchQuery,
  ]);

  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "all") return subCategories;
    return subCategories.filter(
      (sc) => String(sc.categoryId) === selectedCategory
    );
  }, [subCategories, selectedCategory]);

  // Compute per-item discount in RM (supports sen/decimals)
  const getItemDiscountRM = (item: CartItem): number => {
    const gross = item.customPrice * item.qty;
    if (item.discountType === "percent") {
      const pct = Math.min(100, Math.max(0, Number(item.discountValue || 0)));
      return Number(((gross * pct) / 100).toFixed(2));
    }
    return Number(
      Math.min(gross, Math.max(0, Number(item.discountValue || 0))).toFixed(2)
    );
  };

  // Compute Gross, Item Discounts, Subtotal After Item Disc, Order/Total Discount, and Net Payable
  const totals = useMemo(() => {
    let grossTotal = 0;
    let itemDiscountTotal = 0;
    for (const item of cart) {
      const lineGross = item.customPrice * item.qty;
      const lineDisc = getItemDiscountRM(item);
      grossTotal += lineGross;
      itemDiscountTotal += lineDisc;
    }
    grossTotal = Number(grossTotal.toFixed(2));
    itemDiscountTotal = Number(itemDiscountTotal.toFixed(2));

    const subtotalAfterItemDisc = Math.max(
      0,
      Number((grossTotal - itemDiscountTotal).toFixed(2))
    );

    const rawOrdVal = Math.max(0, parseFloat(orderDiscountInput || "0") || 0);
    const orderDiscountAmount =
      orderDiscountType === "percent"
        ? Number(
            (
              (subtotalAfterItemDisc * Math.min(100, rawOrdVal)) /
              100
            ).toFixed(2)
          )
        : Number(Math.min(subtotalAfterItemDisc, rawOrdVal).toFixed(2));

    const discountTotal = Number(
      (itemDiscountTotal + orderDiscountAmount).toFixed(2)
    );
    const netTotal = Math.max(
      0,
      Number((grossTotal - discountTotal).toFixed(2))
    );

    // Calculate sen remainder on subtotalAfterItemDisc (e.g., RM 20.60 -> 0.60 sen)
    const senRemainder = Number(
      (subtotalAfterItemDisc - Math.floor(subtotalAfterItemDisc)).toFixed(2)
    );

    return {
      grossTotal,
      itemDiscountTotal,
      subtotalAfterItemDisc,
      orderDiscountValue: rawOrdVal,
      orderDiscountAmount,
      discountTotal,
      netTotal,
      senRemainder,
    };
  }, [cart, orderDiscountType, orderDiscountInput]);

  useEffect(() => {
    if (paymentMethod === "transfer" || paymentMethod === "qr_pay") {
      setCashAmount("0");
      setTransferAmount(totals.netTotal.toFixed(2));
    }
  }, [totals.netTotal, paymentMethod]);

  const bankOptions = useMemo(() => {
    const list: string[] = [];
    if (settings?.bankName) {
      list.push(
        `${settings.bankName} - ${settings.bankAccountNumber} (${settings.bankAccountHolder})`
      );
    }
    if (Array.isArray(settings?.secondaryBanks)) {
      for (const b of settings.secondaryBanks) {
        if (b.bankName) {
          list.push(`${b.bankName} - ${b.accountNumber} (${b.accountHolder})`);
        }
      }
    }
    if (list.length === 0) {
      list.push("Maybank - 514012349988 (GUNDAM BASE MALAYSIA SDN BHD)");
    }
    return list;
  }, [settings]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    const paid = Number(cashAmount || 0);
    return Math.max(0, Number((paid - totals.netTotal).toFixed(2)));
  }, [paymentMethod, cashAmount, totals.netTotal]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Please add at least one product to the cart");
      return;
    }

    if (paymentMethod === "cash") {
      const paid = Number(cashAmount || 0);
      if (paid < totals.netTotal) {
        toast.error(
          `Cash received (${formatRM(paid)}) is less than Net Total (${formatRM(totals.netTotal)})`
        );
        return;
      }
    }

    const selectedCust = customers.find(
      (c) => String(c.id) === selectedCustomerId
    );

    setSubmitting(true);
    try {
      const payload = {
        id: editingTransaction?.id,
        idCabang: effectiveBranchId,
        customerId: selectedCust ? selectedCust.id : null,
        customerName: selectedCust ? selectedCust.name : "Walk-in Customer",
        customerPhone: selectedCust ? selectedCust.phone : "",
        orderDiscountType,
        orderDiscountValue: totals.orderDiscountValue,
        orderDiscountAmount: totals.orderDiscountAmount,
        paymentMethod,
        cashAmount:
          paymentMethod === "transfer" || paymentMethod === "qr_pay"
            ? 0
            : Number(cashAmount || totals.netTotal),
        transferAmount:
          paymentMethod === "cash"
            ? 0
            : Number(transferAmount || totals.netTotal),
        bankAccountInfo:
          paymentMethod === "cash"
            ? null
            : paymentMethod === "qr_pay"
              ? `DuitNow QR (${selectedBank || bankOptions[0]})`
              : selectedBank || bankOptions[0],
        notes,
        items: cart.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          originalPrice: item.originalPrice,
          customPrice: item.customPrice,
          qty: item.qty,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountAmount: getItemDiscountRM(item),
        })),
      };

      const res = await fetch("/api/transactions", {
        method: editingTransaction ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Transaction failed");
      }

      toast.success(
        editingTransaction
          ? `Transaction ${json.data.invoiceNo} updated!`
          : `Checkout complete! Invoice ${json.data.invoiceNo}`
      );

      if (editingTransaction && onEditSuccess) {
        onEditSuccess(json.data);
        return;
      }

      setCompletedTx(json.data);
      setReceiptOpen(true);
      setCart([]);
      setOrderDiscountInput("");
      setCashAmount("");
      setTransferAmount("");
      setSelectedCustomerId("walk-in");
      setNotes("");
      loadPosBundle();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT 7 COLUMNS: PRODUCT CATALOG & BARCODE SCANNER */}
      <div className="xl:col-span-7 space-y-4">
        <Card className="border-blue-200 bg-gradient-to-r from-white via-white to-blue-50/70 shadow-xs">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Gunpla name, grade, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <form onSubmit={handleBarcodeFormSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    ref={barcodeRef}
                    placeholder="Scan barcode or type code + Enter..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="pl-9 h-10 font-mono border-primary/40 focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" variant="mecha" className="h-10 px-4">
                  Scan
                </Button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  setSelectedSubCategory("all");
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

              <Select
                value={selectedSubCategory}
                onValueChange={setSelectedSubCategory}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Grades / Sub-Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {availableSubCategories.map((sc) => (
                    <SelectItem key={sc.id} value={String(sc.id)}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
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
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-56 rounded-xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">
              No products found in this branch matching your filter
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try clearing your search query or switching branch in the top-right
              selector.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const outOfStock = Number(product.stock) <= 0;
              const inCart = cart.find((c) => c.productId === product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => !outOfStock && addProductToCart(product)}
                  className={`group relative rounded-xl border bg-card overflow-hidden transition-all flex flex-col justify-between ${
                    outOfStock
                      ? "opacity-55 cursor-not-allowed border-border"
                      : "cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99]"
                  } ${inCart ? "ring-2 ring-primary border-primary" : "border-border/80"}`}
                >
                  <div>
                    <div className="relative h-32 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={product.image || "/images/gundam/rx78.svg"}
                        alt={product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="bg-black/75 text-white border-white/10 text-[10px] font-mono px-1.5 py-0">
                          {product.subCategoryName?.split(" ")[0] || "GUNPLA"}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={
                            outOfStock
                              ? "destructive"
                              : Number(product.stock) <= 10
                                ? "warning"
                                : "success"
                          }
                          className="text-[10px] font-mono px-1.5 py-0 backdrop-blur-xs"
                        >
                          Stock: {product.stock}
                        </Badge>
                      </div>
                      {inCart && (
                        <div className="absolute bottom-2 right-2 h-6 px-2 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold flex items-center justify-center shadow">
                          {inCart.qty} in cart
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                        <span>#{product.productCode}</span>
                        <span className="truncate max-w-[90px]">
                          {product.brandName?.split(" ")[0]}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold leading-snug line-clamp-2 min-h-[2.2rem]">
                        {product.name}
                      </h4>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center justify-between border-t border-border/50">
                    <span className="font-mono font-extrabold text-sm text-primary">
                      {formatRM(product.price)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant={inCart ? "mecha" : "secondary"}
                      className="h-7 w-7 rounded-lg"
                      disabled={outOfStock}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT 5 COLUMNS: ACTIVE CART TABLE, CUSTOMER & PAYMENT */}
      <div className="xl:col-span-5 space-y-4">
        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="p-4 border-b border-blue-100 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">
                  {editingTransaction
                    ? `Editing ${editingTransaction.invoiceNo}`
                    : "Current Order Cart"}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Item discount + Total receipt discount (% or RM & sen)
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCart([]);
                  setOrderDiscountInput("");
                }}
                className="text-xs text-destructive hover:text-destructive h-8"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Customer Selection + Fast Popup Add Customer */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between">
                <span>Customer</span>
                <button
                  type="button"
                  onClick={() => setQuickCustomerOpen(true)}
                  className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 normal-case"
                >
                  <UserPlus className="h-3 w-3" />
                  + Quick Add Customer
                </button>
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">
                      Walk-in Customer (General)
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setQuickCustomerOpen(true)}
                  title="Add New Customer"
                >
                  <UserPlus className="h-4 w-4 text-primary" />
                </Button>
              </div>
            </div>

            {/* Cart Items Table with Editable Price & Discount (% / RM & Sen) */}
            {cart.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-border rounded-xl space-y-2">
                <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-semibold text-muted-foreground">
                  No items in cart yet. Click a product card or scan a barcode!
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-100 overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 py-2 text-[10px] w-8">
                          No.
                        </TableHead>
                        <TableHead className="px-2.5 py-2 text-[10px]">
                          Item
                        </TableHead>
                        <TableHead className="px-2 py-2 text-[10px] w-[88px]">
                          Qty
                        </TableHead>
                        <TableHead className="px-2 py-2 text-[10px] w-[100px]">
                          Price (RM)
                        </TableHead>
                        <TableHead className="px-2 py-2 text-[10px] w-[125px]">
                          Item Disc
                        </TableHead>
                        <TableHead className="px-2.5 py-2 text-[10px] text-right">
                          Subtotal
                        </TableHead>
                        <TableHead className="w-7 px-1" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item, index) => {
                        const discRM = getItemDiscountRM(item);
                        const netSub = Math.max(
                          0,
                          Number((item.customPrice * item.qty - discRM).toFixed(2))
                        );
                        return (
                          <TableRow key={item.productId}>
                            <TableCell className="px-2 py-2 font-mono text-xs font-bold text-slate-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="px-2.5 py-2">
                              <div className="font-semibold text-xs leading-tight line-clamp-2">
                                {item.productName}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                #{item.productCode}
                              </div>
                            </TableCell>

                            {/* Qty Controls */}
                            <TableCell className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCart((prev) =>
                                      prev
                                        .map((it, i) =>
                                          i === index
                                            ? { ...it, qty: it.qty - 1 }
                                            : it
                                        )
                                        .filter((it) => it.qty > 0)
                                    );
                                  }}
                                  className="h-6 w-6 rounded bg-muted hover:bg-accent flex items-center justify-center"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.maxStock}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = Math.min(
                                      item.maxStock,
                                      Math.max(1, Number(e.target.value || 1))
                                    );
                                    setCart((prev) =>
                                      prev.map((it, i) =>
                                        i === index ? { ...it, qty: val } : it
                                      )
                                    );
                                  }}
                                  className="w-9 h-6 text-center font-mono text-xs bg-background border border-input rounded"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.qty + 1 > item.maxStock) {
                                      toast.warning(
                                        `Max stock (${item.maxStock}) reached`
                                      );
                                      return;
                                    }
                                    setCart((prev) =>
                                      prev.map((it, i) =>
                                        i === index
                                          ? { ...it, qty: it.qty + 1 }
                                          : it
                                      )
                                    );
                                  }}
                                  className="h-6 w-6 rounded bg-muted hover:bg-accent flex items-center justify-center"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>

                            {/* Editable Unit Price (RM & Sen) */}
                            <TableCell className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={
                                  item.customPriceInput ??
                                  String(item.customPrice)
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(
                                    /[^0-9.]/g,
                                    ""
                                  );
                                  const num = Math.max(
                                    0,
                                    parseFloat(raw || "0") || 0
                                  );
                                  setCart((prev) =>
                                    prev.map((it, i) =>
                                      i === index
                                        ? {
                                            ...it,
                                            customPriceInput: raw,
                                            customPrice: num,
                                          }
                                        : it
                                    )
                                  );
                                }}
                                className="w-20 h-7 px-1.5 font-mono text-xs bg-background border border-input rounded focus:ring-1 focus:ring-primary"
                                title="Edit unit price (RM & Sen)"
                              />
                              {item.customPrice !== item.originalPrice && (
                                <span className="block text-[9px] font-mono text-amber-600">
                                  Cat: {formatRM(item.originalPrice)}
                                </span>
                              )}
                            </TableCell>

                            {/* Per-Item Discount (% or RM & Sen toggle) */}
                            <TableCell className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCart((prev) =>
                                      prev.map((it, i) =>
                                        i === index
                                          ? {
                                              ...it,
                                              discountType:
                                                it.discountType === "rm"
                                                  ? "percent"
                                                  : "rm",
                                              discountValue: 0,
                                              discountInput: "",
                                            }
                                          : it
                                      )
                                    )
                                  }
                                  className="h-7 px-1.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold hover:bg-blue-700 shrink-0"
                                  title="Click to switch between RM and % discount"
                                >
                                  {item.discountType === "percent" ? "%" : "RM"}
                                </button>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={item.discountInput ?? ""}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^0-9.]/g,
                                      ""
                                    );
                                    const num = Math.max(
                                      0,
                                      parseFloat(raw || "0") || 0
                                    );
                                    setCart((prev) =>
                                      prev.map((it, i) =>
                                        i === index
                                          ? {
                                              ...it,
                                              discountInput: raw,
                                              discountValue: num,
                                            }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-16 h-7 px-1.5 font-mono text-xs bg-background border border-input rounded"
                                />
                              </div>
                              {discRM > 0 && (
                                <span className="block text-[9px] font-mono text-emerald-600 font-semibold mt-0.5">
                                  -{formatRM(discRM)}
                                </span>
                              )}
                            </TableCell>

                            {/* Net Subtotal */}
                            <TableCell className="px-2.5 py-2 text-right font-mono font-bold text-xs whitespace-nowrap">
                              {formatRM(netSub)}
                            </TableCell>

                            {/* Remove Row */}
                            <TableCell className="px-1 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                                className="text-muted-foreground hover:text-destructive p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Order Totals & Additional Total Receipt Discount (% or RM & Sen + Round Sen Helper) */}
            <div className="rounded-xl bg-blue-50/50 p-3.5 border border-blue-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>
                  Gross Total ({cart.reduce((a, b) => a + b.qty, 0)} items)
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatRM(totals.grossTotal)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600">
                <span>Item Discounts</span>
                <span className="font-mono font-semibold">
                  -{formatRM(totals.itemDiscountTotal)}
                </span>
              </div>

              <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-blue-100">
                <span>Subtotal (After Item Discount)</span>
                <span className="font-mono">
                  {formatRM(totals.subtotalAfterItemDisc)}
                </span>
              </div>

              {/* Additional Total / Receipt Discount Row (% or RM & Sen) */}
              <div className="pt-1.5 border-t border-blue-100 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-blue-950 block">
                      Total / Receipt Discount
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Extra discount on total (% or RM / sen, e.g. 0.60)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderDiscountType((prev) =>
                          prev === "rm" ? "percent" : "rm"
                        );
                        setOrderDiscountInput("");
                      }}
                      className="h-8 px-2.5 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold hover:bg-blue-700 transition-colors"
                      title="Toggle Total Discount between RM and %"
                    >
                      {orderDiscountType === "percent" ? "%" : "RM"}
                    </button>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={
                        orderDiscountType === "percent" ? "e.g. 5" : "e.g. 0.60"
                      }
                      value={orderDiscountInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        setOrderDiscountInput(raw);
                      }}
                      className="w-24 h-8 font-mono text-xs font-bold bg-white border-blue-200 text-right"
                    />
                  </div>
                </div>

                {/* Quick 1-Click Sen Rounding Button when Subtotal has sen (e.g. RM 20.60 -> -RM 0.60) */}
                <div className="flex items-center justify-between">
                  {totals.senRemainder > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderDiscountType("rm");
                        setOrderDiscountInput(totals.senRemainder.toFixed(2));
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 border border-amber-300 font-mono text-[10px] font-bold transition-colors"
                    >
                      <Coins className="h-3 w-3" />
                      Round Sen (-RM {totals.senRemainder.toFixed(2)}) →{" "}
                      {formatRM(Math.floor(totals.subtotalAfterItemDisc))}
                    </button>
                  ) : (
                    <span />
                  )}

                  {totals.orderDiscountAmount > 0 && (
                    <span className="font-mono font-bold text-emerald-600 ml-auto">
                      -{formatRM(totals.orderDiscountAmount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-blue-100">
                <span>Total Combined Discount</span>
                <span className="font-mono">
                  -{formatRM(totals.discountTotal)}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold pt-2 border-t border-blue-200">
                <span className="text-blue-950">NET PAYABLE</span>
                <span className="font-mono text-blue-700">
                  {formatRM(totals.netTotal)}
                </span>
              </div>
            </div>

            {/* Payment Method Tabs (Cash / Transfer / QR Pay) */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "cash" ? "mecha" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("cash")}
                  className="h-9 text-xs"
                >
                  <Banknote className="h-4 w-4 mr-1" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "transfer" ? "mecha" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("transfer")}
                  className="h-9 text-xs"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Transfer
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "qr_pay" ? "mecha" : "outline"}
                  size="sm"
                  onClick={() => setPaymentMethod("qr_pay")}
                  className="h-9 text-xs"
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Pay
                </Button>
              </div>

              {/* CASH PAYMENT INPUTS */}
              {paymentMethod === "cash" && (
                <div className="space-y-2.5 rounded-xl bg-muted/30 p-3 border border-border">
                  <div className="space-y-1">
                    <Label>Cash Received (RM)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={totals.netTotal.toFixed(2)}
                      value={cashAmount}
                      onChange={(e) =>
                        setCashAmount(e.target.value.replace(/[^0-9.]/g, ""))
                      }
                      className="font-mono text-base font-bold h-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-[11px] font-mono"
                      onClick={() => setCashAmount(totals.netTotal.toFixed(2))}
                    >
                      Exact ({formatRM(totals.netTotal)})
                    </Button>
                    {[20, 50, 100, 200, 500, 1000].map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] font-mono"
                        onClick={() => setCashAmount(String(amt))}
                      >
                        RM {amt}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs font-bold">
                    <span className="text-muted-foreground">Change Due:</span>
                    <span className="font-mono text-sm text-emerald-600">
                      {formatRM(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* BANK TRANSFER DETAILS */}
              {paymentMethod === "transfer" && (
                <div className="space-y-2.5 rounded-xl bg-muted/30 p-3 border border-border">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Destination Store Bank Account
                    </Label>
                    <Select
                      value={selectedBank || bankOptions[0]}
                      onValueChange={setSelectedBank}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bankOptions.map((b, i) => (
                          <SelectItem key={i} value={b} className="text-xs">
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-muted-foreground">
                      Transfer Amount:
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {formatRM(totals.netTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* QR PAY DETAILS */}
              {paymentMethod === "qr_pay" && (
                <div className="space-y-2.5 rounded-xl bg-blue-50/50 p-3 border border-blue-200">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-blue-900">
                      <QrCode className="h-3.5 w-3.5 text-blue-600" />
                      QR Pay Merchant Account (DuitNow QR / E-Wallet)
                    </Label>
                    <Select
                      value={selectedBank || bankOptions[0]}
                      onValueChange={setSelectedBank}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bankOptions.map((b, i) => (
                          <SelectItem key={i} value={b} className="text-xs">
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-600">QR Pay Amount:</span>
                    <span className="font-mono font-extrabold text-blue-700">
                      {formatRM(totals.netTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Note */}
            <div className="space-y-1">
              <Label>Transaction Note (Optional)</Label>
              <Input
                placeholder="Optional cashier remark or serial reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Checkout Action Buttons */}
            <div className="flex gap-2 pt-1">
              {editingTransaction && onCancelEdit && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="flex-1"
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                type="button"
                variant="mecha"
                size="lg"
                disabled={submitting || cart.length === 0}
                onClick={handleCheckout}
                className="flex-1 font-bold"
              >
                <CheckCircle2 className="h-5 w-5 mr-1" />
                {submitting
                  ? "Processing..."
                  : editingTransaction
                    ? `Update Order (${formatRM(totals.netTotal)})`
                    : `Complete & Print (${formatRM(totals.netTotal)})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Customer Creation Popup */}
      <QuickCustomerModal
        open={quickCustomerOpen}
        onOpenChange={setQuickCustomerOpen}
        idCabang={effectiveBranchId}
        onCreated={(newCust) => {
          setCustomers((prev) => [newCust, ...prev]);
          setSelectedCustomerId(String(newCust.id));
        }}
      />

      {/* Post-Checkout Receipt Detail & Inline Print Popup */}
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={completedTx}
      />
    </div>
  );
}
