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
import { formatRM } from "@/lib/utils";
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
} from "lucide-react";

export default function VouchersPage() {
  const { activeBranchId, branches } = useAppStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const [form, setForm] = useState({
    id: 0,
    idCabang: 0,
    code: "",
    name: "",
    discountType: "percent" as "percent" | "rm",
    discountValue: "10",
    minSpend: "0",
    maxDiscount: "0",
    usageLimit: "0",
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
    setForm((prev) => ({ ...prev, code: `${prefix}${prev.discountValue || "10"}-${suffix}` }));
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
      usageLimit: "0",
      startDate: today,
      endDate: thirtyDaysLater,
      isActive: 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setForm({
      id: item.id,
      idCabang: item.id_cabang ?? item.idCabang ?? 0,
      code: item.code,
      name: item.name,
      discountType: item.discount_type || item.discountType || "percent",
      discountValue: String(item.discount_value ?? item.discountValue),
      minSpend: String(item.min_spend ?? item.minSpend ?? "0"),
      maxDiscount: String(item.max_discount ?? item.maxDiscount ?? "0"),
      usageLimit: String(item.usage_limit ?? item.usageLimit ?? "0"),
      startDate: typeof item.start_date === "string" ? item.start_date.slice(0, 10) : item.startDate,
      endDate: typeof item.end_date === "string" ? item.end_date.slice(0, 10) : item.endDate,
      isActive: item.is_active ?? item.isActive ?? 1,
    });
    setModalOpen(true);
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
          usageLimit: parseInt(form.usageLimit) || 0,
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: Number(form.isActive),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "Voucher updated successfully!" : "Voucher created successfully!");
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

  // KPIs
  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter((v) => v.status === "active").length;
    const scheduled = vouchers.filter((v) => v.status === "scheduled").length;
    const expiredOrDepleted = vouchers.filter(
      (v) => v.status === "expired" || v.status === "depleted" || v.status === "disabled"
    ).length;
    return { total, active, scheduled, expiredOrDepleted };
  }, [vouchers]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Voucher Code",
      cell: ({ row }) => {
        const code = row.original.code;
        return (
          <div className="flex items-center gap-2">
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
        return (
          <div className="space-y-0.5 max-w-[240px]">
            <div className="font-bold text-xs text-slate-900 truncate">
              {v.name}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <Building2 className="h-3 w-3 text-slate-400" />
              <span>{branchScope}</span>
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
        const isPct = v.discount_type === "percent" || v.discountType === "percent";
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
      header: "Min Spend / Usage",
      cell: ({ row }) => {
        const v = row.original;
        const minSpend = Number(v.min_spend ?? v.minSpend);
        const limit = Number(v.usage_limit ?? v.usageLimit);
        const count = Number(v.usage_count ?? v.usageCount ?? 0);

        return (
          <div className="text-xs space-y-0.5">
            <div className="text-slate-700">
              {minSpend > 0 ? (
                <span>Min: {formatRM(minSpend)}</span>
              ) : (
                <span className="text-slate-400">No min spend</span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {limit > 0 ? `${count} / ${limit} uses` : `${count} uses (Unlimited)`}
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
        const start = typeof v.start_date === "string" ? v.start_date.slice(0, 10) : v.startDate;
        const end = typeof v.end_date === "string" ? v.end_date.slice(0, 10) : v.endDate;
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
            Create and manage promotional discount vouchers (% or RM) with validity dates and usage terms for POS cashier checkout
          </p>
        </div>

        <Button onClick={openCreateModal} variant="mecha" className="font-bold shadow-md">
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

        <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Vouchers
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {stats.active}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Currently redeemable in POS
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming / Scheduled
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-indigo-700">
              {stats.scheduled}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Future promo campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Expired / Depleted
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-slate-700">
              {stats.expiredOrDepleted}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inactive or expired vouchers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={vouchers}
        searchPlaceholder="Search vouchers by code, name, or branch..."
        onBulkDelete={handleBulkDelete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move Voucher to Trash?"
        itemName={deleteTarget?.code}
        description={
          deleteTarget
            ? `Moving voucher "${deleteTarget.code}" to Trash will immediately prevent cashiers from applying it in POS.`
            : undefined
        }
        onConfirm={confirmSingleDelete}
      />

      {/* Create / Edit Voucher Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-blue-200">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-white">
                  {form.id ? "Edit Discount Voucher" : "Create New Discount Voucher"}
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Define voucher code, discount (% or RM), minimum purchase, and active validity dates
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
            {/* Row 1: Code & Generator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Voucher Code *</span>
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
                      🌐 All Branches (HQ & Branches)
                    </SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)} className="text-xs">
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
                    onClick={() => setForm({ ...form, discountType: "percent" })}
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
                      step={form.discountType === "percent" ? "1" : "0.01"}
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
                    step="0.01"
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
                    step="0.01"
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

            {/* Validity Period & Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="h-9 text-xs border-blue-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-600">
                  Usage Limit (0 = Unlimited)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  className="h-9 font-mono text-xs border-blue-200"
                />
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
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
                  <SelectItem value="1" className="text-xs text-emerald-600 font-bold">
                    Active
                  </SelectItem>
                  <SelectItem value="0" className="text-xs text-slate-500 font-bold">
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
    </div>
  );
}
