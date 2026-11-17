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
import { ReceiptModal } from "@/components/pos/receipt-modal";
import { formatRM, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Tag,
  AlertCircle,
  Building2,
  History,
  UserCheck,
  Users,
  Receipt,
  ExternalLink,
  Infinity as InfinityIcon,
  Search,
  Check,
} from "lucide-react";

export default function VouchersPage() {
  const { activeBranchId, branches } = useAppStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // History & Redemption Detail Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [form, setForm] = useState({
    id: 0,
    idCabang: 0,
    code: "",
    name: "",
    discountType: "percent" as "percent" | "rm",
    discountValue: "10",
    minSpend: "0",
    maxDiscount: "0",
    isUnlimitedUsage: true,
    usageLimit: "0",
    oncePerCustomer: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    isActive: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vouchers?idCabang=${activeBranchId}`);
      const json = await res.json();
      if (json.success) setVouchers(json.data || []);
    } catch {
      toast.error("Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = form.discountType === "percent" ? "GUNPLA" : "VOUCH";
    setForm((prev) => ({
      ...prev,
      code: `${prefix}${prev.discountValue || "10"}-${suffix}`,
    }));
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .slice(0, 10);
    setForm({
      id: 0,
      idCabang: 0,
      code: `GUNDAM${Math.floor(10 + Math.random() * 90)}`,
      name: "",
      discountType: "percent",
      discountValue: "10",
      minSpend: "0",
      maxDiscount: "0",
      isUnlimitedUsage: true,
      usageLimit: "0",
      oncePerCustomer: 0,
      startDate: today,
      endDate: thirtyDaysLater,
      isActive: 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    const limit = Number(item.usage_limit ?? item.usageLimit ?? 0);
    setForm({
      id: item.id,
      idCabang: item.id_cabang ?? item.idCabang ?? 0,
      code: item.code,
      name: item.name,
      discountType: item.discount_type || item.discountType || "percent",
      discountValue: String(item.discount_value ?? item.discountValue),
      minSpend: String(item.min_spend ?? item.minSpend ?? "0"),
      maxDiscount: String(item.max_discount ?? item.maxDiscount ?? "0"),
      isUnlimitedUsage: limit === 0,
      usageLimit: limit > 0 ? String(limit) : "0",
      oncePerCustomer: Number(item.once_per_customer ?? item.oncePerCustomer ?? 0),
      startDate:
        typeof item.start_date === "string"
          ? item.start_date.slice(0, 10)
          : item.startDate,
      endDate:
        typeof item.end_date === "string"
          ? item.end_date.slice(0, 10)
          : item.endDate,
      isActive: item.is_active ?? item.isActive ?? 1,
    });
    setModalOpen(true);
  };

  const openHistoryModal = async (voucher: any) => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    setHistorySearch("");
    try {
      const res = await fetch(`/api/vouchers/${voucher.id}/history`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setHistoryData(json.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load voucher usage history");
      setHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openTxReceipt = async (txId: number) => {
    try {
      const res = await fetch(`/api/transactions?id=${txId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedTxForReceipt(json.data);
        setReceiptOpen(true);
      }
    } catch {
      toast.error("Failed to load invoice receipt");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Voucher code is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Voucher name is required");
      return;
    }
    const val = parseFloat(form.discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (form.discountType === "percent" && val > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }
    if (form.startDate > form.endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const limitVal = form.isUnlimitedUsage ? 0 : parseInt(form.usageLimit) || 0;

    try {
      const res = await fetch("/api/vouchers", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          idCabang: Number(form.idCabang),
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          discountType: form.discountType,
          discountValue: val,
          minSpend: parseFloat(form.minSpend) || 0,
          maxDiscount: parseFloat(form.maxDiscount) || 0,
          usageLimit: limitVal,
          oncePerCustomer: form.oncePerCustomer,
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: Number(form.isActive),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(
        form.id ? "Voucher updated successfully!" : "Voucher created successfully!"
      );
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save voucher");
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/vouchers?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`Moved voucher "${deleteTarget.code}" to Trash`);
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
          fetch(`/api/vouchers?id=${row.id}`, { method: "DELETE" })
        )
      );
      toast.success(`Moved ${selected.length} voucher(s) to Trash`);
      loadData();
    } catch {
      toast.error("Failed to delete some vouchers");
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard!`);
  };

  // Filtered redemptions in history modal
  const filteredRedemptions = useMemo(() => {
    if (!historyData?.redemptions) return [];
    if (!historySearch.trim()) return historyData.redemptions;
    const q = historySearch.toLowerCase().trim();
    return historyData.redemptions.filter(
      (r: any) =>
        r.invoiceNo.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        (r.customerPhone && r.customerPhone.toLowerCase().includes(q)) ||
        (r.cashierName && r.cashierName.toLowerCase().includes(q))
    );
  }, [historyData, historySearch]);

  // KPIs
  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.status === "active").length;
    const scheduled = vouchers.filter((v) => v.status === "scheduled").length;
    const expiredOrDepleted = vouchers.filter(
      (v) =>
        v.status === "expired" ||
        v.status === "depleted" ||
        v.status === "disabled"
    ).length;
    const totalRedemptions = vouchers.reduce(
      (acc, v) => acc + Number(v.usage_count ?? v.usageCount ?? 0),
      0
    );
    return { total, active, scheduled, expiredOrDepleted, totalRedemptions };
  }, [vouchers]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Voucher Code",
      cell: ({ row }) => {
        const code = row.original.code;
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md tracking-wider">
              {code}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => copyVoucherCode(code)}
              className="h-6 w-6 text-slate-400 hover:text-blue-600"
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Voucher Title & Scope",
      cell: ({ row }) => {
        const v = row.original;
        const branchScope =
          v.id_cabang === 0 || v.idCabang === 0
            ? "All Branches (HQ & Nationwide)"
            : v.branchName || `Branch #${v.id_cabang}`;
        const oncePerCust = Number(v.once_per_customer ?? v.oncePerCustomer ?? 0) === 1;

        return (
          <div className="space-y-1 max-w-[240px]">
            <div className="font-bold text-xs text-slate-900 truncate">
              {v.name}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-500 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                {branchScope}
              </span>
              {oncePerCust && (
                <Badge
                  variant="outline"
                  className="py-0 px-1 text-[9px] border-purple-300 text-purple-700 bg-purple-50 flex items-center gap-0.5"
                >
                  <UserCheck className="h-2.5 w-2.5" />
                  1x/Customer
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "discount",
      header: "Discount Value",
      cell: ({ row }) => {
        const v = row.original;
        const isPct =
          v.discount_type === "percent" || v.discountType === "percent";
        const val = Number(v.discount_value ?? v.discountValue);
        const maxDisc = Number(v.max_discount ?? v.maxDiscount);

        return (
          <div>
            <div className="font-mono font-bold text-xs text-emerald-600">
              {isPct ? `${val}% OFF` : `-${formatRM(val)}`}
            </div>
            {isPct && maxDisc > 0 && (
              <div className="text-[10px] text-slate-500">
                Max: {formatRM(maxDisc)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "terms",
      header: "Min Spend / Usage Quota",
      cell: ({ row }) => {
        const v = row.original;
        const minSpend = Number(v.min_spend ?? v.minSpend);
        const limit = Number(v.usage_limit ?? v.usageLimit ?? 0);
        const count = Number(v.usage_count ?? v.usageCount ?? 0);

        return (
          <div className="text-xs space-y-1">
            <div className="text-slate-700">
              {minSpend > 0 ? (
                <span>Min: {formatRM(minSpend)}</span>
              ) : (
                <span className="text-slate-400 text-[11px]">No min spend</span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => openHistoryModal(v)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 transition-colors"
                title="Click to view redemption list"
              >
                <History className="h-3 w-3 text-slate-400" />
                {limit > 0 ? `${count} / ${limit} uses` : `${count} uses (Unlimited)`}
              </button>
            </div>
          </div>
        );
      },
    },
    {
      id: "period",
      header: "Validity Period",
      cell: ({ row }) => {
        const v = row.original;
        const start =
          typeof v.start_date === "string"
            ? v.start_date.slice(0, 10)
            : v.startDate;
        const end =
          typeof v.end_date === "string"
            ? v.end_date.slice(0, 10)
            : v.endDate;
        return (
          <div className="text-xs font-mono space-y-0.5">
            <div className="text-slate-700">{start}</div>
            <div className="text-slate-500 text-[11px]">to {end}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status;
        if (st === "active") {
          return (
            <Badge variant="success" className="text-[10px] font-bold">
              Active
            </Badge>
          );
        }
        if (st === "scheduled") {
          return (
            <Badge variant="info" className="text-[10px] font-bold">
              Scheduled
            </Badge>
          );
        }
        if (st === "expired") {
          return (
            <Badge variant="destructive" className="text-[10px] font-bold">
              Expired
            </Badge>
          );
        }
        if (st === "depleted") {
          return (
            <Badge variant="warning" className="text-[10px] font-bold">
              Depleted
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-[10px] text-slate-500">
            Disabled
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => openHistoryModal(row.original)}
            title="View Usage & POS Invoices"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-slate-700 border-slate-200 hover:bg-slate-100"
            onClick={() => openEditModal(row.original)}
            title="Edit Voucher"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive border-red-100 hover:bg-red-50"
            onClick={() => setDeleteTarget(row.original)}
            title="Delete Voucher"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
            <Ticket className="h-6 w-6 text-primary" />
            Master Data Discount Vouchers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create promotional discount vouchers with usage limits, 1x customer flags, and track POS invoice redemption history
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="mecha"
          className="font-bold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Voucher
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Vouchers
            </CardTitle>
            <Ticket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {stats.total}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registered voucher codes
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Active Vouchers
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {stats.active}
            </div>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Available for POS cashier
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Scheduled / Upcoming
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-700">
              {stats.scheduled}
            </div>
            <p className="text-[11px] text-amber-600 mt-0.5">
              Future promotion window
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-white to-purple-50/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Total Redemptions
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-purple-700">
              {stats.totalRedemptions}
            </div>
            <p className="text-[11px] text-purple-600 mt-0.5">
              POS orders with vouchers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={vouchers}
        searchPlaceholder="Search voucher code or title..."
        onBulkDelete={handleBulkDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        title="Move Voucher to Trash?"
        description={`Are you sure you want to delete voucher "${deleteTarget?.code}" (${deleteTarget?.name})? You can restore it later from Trash.`}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={confirmSingleDelete}
      />

      {/* Create / Edit Voucher Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-950">
              <Ticket className="h-5 w-5 text-blue-600" />
              {form.id ? "Edit Discount Voucher" : "Create New Discount Voucher"}
            </DialogTitle>
            <DialogDescription>
              Configure code, validity date range, usage quota, and customer redemption rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Voucher Code & Scope */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Voucher Code *
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. GUNDAM10"
                    className="h-9 font-mono font-bold tracking-wider text-xs uppercase border-blue-200 bg-blue-50/20"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomCode}
                    className="h-9 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 shrink-0"
                    title="Auto-generate promo code"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Gen
                  </Button>
                </div>
              </div>

              {/* Branch Scope */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Target Branch Scope
                </Label>
                <Select
                  value={String(form.idCabang)}
                  onValueChange={(val) =>
                    setForm({ ...form, idCabang: parseInt(val) || 0 })
                  }
                >
                  <SelectTrigger className="h-9 text-xs border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="text-xs">
                      🌐 All Branches (HQ & Nationwide)
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem
                        key={b.id}
                        value={String(b.id)}
                        className="text-xs"
                      >
                        🏬 {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voucher Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Voucher Name / Description *
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Bandai Member 10% Off Weekend Special"
                className="h-9 text-xs border-blue-200"
                required
              />
            </div>

            {/* Discount Type & Value */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">
                  Discount Mechanism *
                </Label>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, discountType: "percent" })
                    }
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      form.discountType === "percent"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    % Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discountType: "rm" })}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      form.discountType === "rm"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    RM Fixed Amount
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    {form.discountType === "percent"
                      ? "Percentage Discount (%) *"
                      : "Fixed Discount Amount (RM) *"}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      max={form.discountType === "percent" ? "100" : undefined}
                      value={form.discountValue}
                      onChange={(e) =>
                        setForm({ ...form, discountValue: e.target.value })
                      }
                      className="h-9 font-mono font-bold text-xs border-blue-200"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {form.discountType === "percent" ? "%" : "RM"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    {form.discountType === "percent"
                      ? "Max Discount Cap (RM, 0 = No Cap)"
                      : "Minimum Spend (RM, 0 = None)"}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={
                      form.discountType === "percent"
                        ? form.maxDiscount
                        : form.minSpend
                    }
                    onChange={(e) =>
                      form.discountType === "percent"
                        ? setForm({ ...form, maxDiscount: e.target.value })
                        : setForm({ ...form, minSpend: e.target.value })
                    }
                    className="h-9 font-mono text-xs border-blue-200"
                  />
                </div>
              </div>

              {form.discountType === "percent" && (
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold text-slate-600">
                    Minimum Spend (RM, 0 = No minimum required)
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={form.minSpend}
                    onChange={(e) =>
                      setForm({ ...form, minSpend: e.target.value })
                    }
                    placeholder="0.00"
                    className="h-9 font-mono text-xs border-blue-200"
                  />
                </div>
              )}
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">
                  Start Date *
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="h-9 text-xs border-blue-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">
                  End Date (Expiry) *
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="h-9 text-xs border-blue-200"
                  required
                />
              </div>
            </div>

            {/* Total Usage Limit Setting (Limited vs Unlimited) */}
            <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-blue-950 block">
                    Batas Kuota Penggunaan (Total Usage Limit)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Tentukan apakah voucher dapat dipakai tanpa batas atau dibatasi kuota
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-blue-200">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isUnlimitedUsage: true,
                        usageLimit: "0",
                      }))
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      form.isUnlimitedUsage
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tanpa Batas
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isUnlimitedUsage: false,
                        usageLimit:
                          prev.usageLimit === "0" ? "50" : prev.usageLimit,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      !form.isUnlimitedUsage
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Batas Kuota
                  </button>
                </div>
              </div>

              {!form.isUnlimitedUsage && (
                <div className="space-y-1 pt-1 border-t border-blue-100">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Maksimal Kuota Transaksi (Jumlah Pemakaian) *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm({ ...form, usageLimit: e.target.value })
                    }
                    placeholder="e.g. 50"
                    className="h-9 font-mono text-xs border-blue-200 bg-white"
                    required={!form.isUnlimitedUsage}
                  />
                  <p className="text-[10px] text-slate-500">
                    Voucher akan otomatis menjadi "Depleted" saat kuota ini habis.
                  </p>
                </div>
              )}
            </div>

            {/* Once Per Customer Flag Setting */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                  Batasi 1x Pakai per Pelanggan (Once Per Customer)
                </span>
                <span className="text-[11px] text-purple-700 block leading-relaxed">
                  Jika diaktifkan, pelanggan (berdasarkan member/nomor HP) tidak bisa menggunakan voucher ini lagi setelah 1x pemakaian.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    oncePerCustomer: prev.oncePerCustomer === 1 ? 0 : 1,
                  }))
                }
                className={`h-8 px-3.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  form.oncePerCustomer === 1
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {form.oncePerCustomer === 1 ? "Aktif (1x/Customer)" : "Bebas Berulang"}
              </button>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-800 block">
                  Voucher Active Status
                </span>
                <span className="text-[11px] text-slate-500">
                  When enabled, cashiers can enter or select this voucher in POS
                </span>
              </div>
              <Select
                value={String(form.isActive)}
                onValueChange={(val) =>
                  setForm({ ...form, isActive: parseInt(val) || 0 })
                }
              >
                <SelectTrigger className="w-28 h-8 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="1"
                    className="text-xs text-emerald-600 font-bold"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="0"
                    className="text-xs text-slate-500 font-bold"
                  >
                    Disabled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="mecha"
                className="h-9 text-xs font-bold shadow-md"
              >
                {form.id ? "Update Voucher" : "Save & Activate Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Voucher Usage & Redemption History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-950 text-base">
              <History className="h-5 w-5 text-blue-600" />
              Detail Riwayat Penggunaan Voucher (POS Redemptions)
            </DialogTitle>
            <DialogDescription>
              Daftar seluruh transaksi kasir POS yang menggunakan voucher ini beserta rincian pelanggan dan invoice.
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              Loading redemption history...
            </div>
          ) : historyData ? (
            <div className="space-y-4 pt-1">
              {/* Voucher Meta Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm text-blue-900 bg-white px-2.5 py-0.5 rounded border border-blue-300">
                      {historyData.voucher?.code}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-bold text-xs border-emerald-300 text-emerald-700 bg-white"
                    >
                      {historyData.voucher?.discount_type === "percent"
                        ? `${historyData.voucher?.discount_value}% OFF`
                        : `RM ${Number(historyData.voucher?.discount_value).toFixed(2)} OFF`}
                    </Badge>
                    {historyData.voucher?.once_per_customer === 1 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-purple-300 text-purple-700 bg-white"
                      >
                        1x per Customer
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-slate-800">
                    {historyData.voucher?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                    <span>
                      Valid:{" "}
                      {typeof historyData.voucher?.start_date === "string"
                        ? historyData.voucher?.start_date.slice(0, 10)
                        : "Any"}{" "}
                      to{" "}
                      {typeof historyData.voucher?.end_date === "string"
                        ? historyData.voucher?.end_date.slice(0, 10)
                        : "Forever"}
                    </span>
                    <span>
                      Quota:{" "}
                      {historyData.voucher?.usage_limit > 0
                        ? `${historyData.voucher?.usage_count} / ${historyData.voucher?.usage_limit}`
                        : `${historyData.voucher?.usage_count} (Unlimited)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyVoucherCode(historyData.voucher?.code)}
                    className="h-8 text-xs border-blue-300 text-blue-700 bg-white hover:bg-blue-50"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy Code
                  </Button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Total Pemakaian
                  </span>
                  <span className="text-xl font-extrabold font-mono text-blue-700">
                    {historyData.summary?.totalRedemptions}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Invoice POS
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Total Diskon Diberikan
                  </span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700">
                    {formatRM(historyData.summary?.totalDiscountGiven || 0)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    Potongan harga
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">
                    Pelanggan Unik
                  </span>
                  <span className="text-xl font-extrabold font-mono text-purple-700">
                    {historyData.summary?.uniqueCustomersCount}
                  </span>
                  <span className="text-[10px] text-purple-600 block">
                    Customer
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">
                    Total Net Revenue
                  </span>
                  <span className="text-xl font-extrabold font-mono text-blue-800">
                    {formatRM(historyData.summary?.totalNetRevenue || 0)}
                  </span>
                  <span className="text-[10px] text-blue-600 block">
                    Dari order ber-voucher
                  </span>
                </div>
              </div>

              {/* Search & Redemption List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Cari invoice, nama pelanggan, nomor HP..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Showing {filteredRedemptions.length} of{" "}
                    {historyData.redemptions?.length || 0} transaction(s)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2.5">#</th>
                          <th className="px-3 py-2.5">Invoice POS</th>
                          <th className="px-3 py-2.5">Tanggal & Waktu</th>
                          <th className="px-3 py-2.5">Customer (Siapa yg Pakai)</th>
                          <th className="px-3 py-2.5">Kasir / Cabang</th>
                          <th className="px-3 py-2.5 text-right">Gross Total</th>
                          <th className="px-3 py-2.5 text-right">Diskon Voucher</th>
                          <th className="px-3 py-2.5 text-right">Net Paid</th>
                          <th className="px-3 py-2.5 text-center">Struk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRedemptions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-3 py-8 text-center text-slate-500"
                            >
                              Belum ada transaksi yang menggunakan voucher ini.
                            </td>
                          </tr>
                        ) : (
                          filteredRedemptions.map((r: any, idx: number) => (
                            <tr
                              key={r.id}
                              className="hover:bg-blue-50/40 transition-colors"
                            >
                              <td className="px-3 py-2 text-slate-400 font-mono">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-blue-700">
                                <button
                                  type="button"
                                  onClick={() => openTxReceipt(r.id)}
                                  className="hover:underline flex items-center gap-1"
                                  title="View invoice receipt"
                                >
                                  {r.invoiceNo}
                                  <ExternalLink className="h-3 w-3 text-slate-400" />
                                </button>
                              </td>
                              <td className="px-3 py-2 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                {formatDateTime(r.createdAt)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-bold text-slate-900">
                                  {r.customerName}
                                </div>
                                {r.customerPhone && (
                                  <div className="font-mono text-[10px] text-slate-500">
                                    {r.customerPhone}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-slate-800">
                                  {r.cashierName}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                  {r.branchName}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">
                                {formatRM(r.grossTotal)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                                -{formatRM(r.voucherDiscountAmount)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-extrabold text-blue-900 whitespace-nowrap">
                                {formatRM(r.netTotal)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openTxReceipt(r.id)}
                                  className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                  title="Open Receipt"
                                >
                                  <Receipt className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Invoice Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={selectedTxForReceipt}
      />
    </div>
  );
}
