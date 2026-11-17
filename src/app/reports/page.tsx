"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
import { formatRM, formatDateTime } from "@/lib/utils";
import { exportSalesReportPdf } from "@/lib/pdf-printer";
import { toast } from "sonner";
import {
  BarChart3,
  FileDown,
  Calendar,
  TrendingUp,
  Clock,
  CalendarDays,
  RotateCcw,
  UserCheck,
} from "lucide-react";

export default function ReportsPage() {
  const { activeBranchId, branches, settings, user } = useAppStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCashier, setSelectedCashier] = useState("all");
  const [cashierUsers, setCashierUsers] = useState<any[]>([]);

  const [reportData, setReportData] = useState<any>({
    cards: {
      dailyNet: 0,
      dailyGross: 0,
      dailyCount: 0,
      weeklyNet: 0,
      weeklyGross: 0,
      weeklyCount: 0,
      monthlyNet: 0,
      monthlyGross: 0,
      monthlyCount: 0,
      filteredGross: 0,
      filteredDiscount: 0,
      filteredNet: 0,
    },
    transactions: [],
  });

  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const isAdmin = user?.role === "admin";

  const fetchReport = async (
    sDate = startDate,
    eDate = endDate,
    cId = selectedCashier
  ) => {
    try {
      const params = new URLSearchParams({
        idCabang: String(activeBranchId),
      });
      if (sDate) params.set("startDate", sDate);
      if (eDate) params.set("endDate", eDate);
      if (isAdmin && cId && cId !== "all") {
        params.set("cashierId", cId);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setReportData(json.data);
      }
    } catch {
      toast.error("Failed to load report data");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetch(`/api/users?idCabang=${activeBranchId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setCashierUsers(json.data || []);
        });
    }
    setSelectedCashier("all");
    fetchReport(startDate, endDate, "all");
  }, [activeBranchId, isAdmin]);

  const handleExportPdf = () => {
    exportSalesReportPdf({
      transactions: reportData.transactions || [],
      cards: reportData.cards,
      settings,
      branchName: activeBranch?.name || `Branch #${activeBranchId}`,
      startDate,
      endDate,
    });
    toast.success("Official PDF Report with Store Letterhead generated!");
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.original.invoiceNo}
        </span>
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
        <span className="text-xs font-medium">
          {row.original.customerName || "Walk-in Customer"}
        </span>
      ),
    },
    {
      accessorKey: "cashierName",
      header: "Cashier",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.original.cashierName}
        </span>
      ),
    },
    {
      accessorKey: "totalItems",
      header: "Qty Sold",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold">
          {row.original.totalItems} pcs
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => {
        const m = String(row.original.paymentMethod || "cash").toLowerCase();
        return (
          <Badge
            variant={
              m === "cash" ? "success" : m === "qr_pay" ? "outline" : "info"
            }
            className="uppercase font-mono text-[10px]"
          >
            {m.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "paymentBreakdown",
      header: "Payment Breakdown",
      cell: ({ row }) => {
        const tx = row.original;
        const m = String(tx.paymentMethod || "cash").toLowerCase();
        if (m === "qr_pay") {
          return (
            <div className="text-xs space-y-0.5 font-mono">
              <div>
                <span className="text-slate-500">QR Pay:</span>{" "}
                <span className="font-bold text-indigo-700">
                  {formatRM(tx.transferAmount || tx.netTotal)}
                </span>
              </div>
              {tx.bankAccountInfo && (
                <div className="text-[10px] font-sans text-slate-500">
                  {tx.bankAccountInfo}
                </div>
              )}
            </div>
          );
        }
        if (m === "transfer") {
          return (
            <div className="text-xs space-y-0.5 font-mono">
              <div>
                <span className="text-slate-500">Transfer:</span>{" "}
                <span className="font-bold text-blue-700">
                  {formatRM(tx.transferAmount || tx.netTotal)}
                </span>
              </div>
              {tx.bankAccountInfo && (
                <div className="text-[10px] font-sans text-slate-500">
                  {tx.bankAccountInfo}
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="text-xs space-y-0.5 font-mono">
            <div>
              <span className="text-slate-500">Cash Paid:</span>{" "}
              <span className="font-bold text-emerald-700">
                {formatRM(tx.cashAmount)}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Change: {formatRM(tx.changeAmount)}
            </div>
          </div>
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
      header: "Discount Details (RM)",
      cell: ({ row }) => {
        const tx = row.original;
        const itemDisc = Number(tx.itemDiscountTotal || 0);
        const ordDisc = Number(tx.orderDiscountAmount || 0);
        const totalDisc = Number(tx.discountTotal || 0);
        return (
          <div className="font-mono text-xs">
            <div className="font-bold text-amber-600">
              -{formatRM(totalDisc)}
            </div>
            {(itemDisc > 0 || ordDisc > 0) && (
              <div className="text-[10px] text-slate-500">
                {itemDisc > 0 ? `Item: -${formatRM(itemDisc)}` : ""}
                {itemDisc > 0 && ordDisc > 0 ? " | " : ""}
                {ordDisc > 0 ? `Total Disc: -${formatRM(ordDisc)}` : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "netTotal",
      header: "Net Revenue (RM)",
      cell: ({ row }) => (
        <span className="font-mono font-extrabold text-xs text-blue-700">
          {formatRM(row.original.netTotal)}
        </span>
      ),
    },
  ];

  const c = reportData.cards;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Sales & Revenue Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.role === "employee"
              ? `Personal sales performance report for ${user.name}`
              : `Branch revenue summary (Daily, Weekly, Monthly) & PDF export with official letterhead`}
          </p>
        </div>

        <Button onClick={handleExportPdf} variant="mecha">
          <FileDown className="h-4 w-4 mr-1.5" />
          Export PDF Report (With Store Header)
        </Button>
      </div>

      {/* Daily, Weekly, Monthly Revenue Cards Above Report Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daily Revenue (Today)
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {formatRM(c.dailyNet)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross: {formatRM(c.dailyGross)} ({c.dailyCount} orders)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-indigo-50/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekly Revenue (7 Days)
            </CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-indigo-700">
              {formatRM(c.weeklyNet)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross: {formatRM(c.weeklyGross)} ({c.weeklyCount} orders)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-sky-50/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Monthly Revenue
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-sky-700">
              {formatRM(c.monthlyNet)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross: {formatRM(c.monthlyGross)} ({c.monthlyCount} orders)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-emerald-50/80">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selected Range Net
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-emerald-700">
              {formatRM(c.filteredNet)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gross: {formatRM(c.filteredGross)} • Disc: -
              {formatRM(c.filteredDiscount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range & Cashier Filter Bar (Cashier dropdown only shown to Admin) */}
      <Card className="border-blue-100">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-[160px] max-w-xs">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[160px] max-w-xs">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="space-y-1 flex-1 min-w-[200px] max-w-xs">
              <Label className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                Filter by Cashier / Staff
              </Label>
              <Select
                value={selectedCashier}
                onValueChange={(val) => {
                  setSelectedCashier(val);
                  fetchReport(startDate, endDate, val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Cashiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers / Staff</SelectItem>
                  {cashierUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} (@{u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="mecha"
              onClick={() => fetchReport(startDate, endDate, selectedCashier)}
            >
              Apply Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedCashier("all");
                fetchReport("", "", "all");
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={reportData.transactions || []}
        searchPlaceholder="Search report by invoice, customer, cashier, or payment method..."
      />
    </div>
  );
}
