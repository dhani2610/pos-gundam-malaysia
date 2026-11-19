"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store/use-app-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatRM } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  Tag,
  CalendarRange,
  RotateCcw,
  PackagePlus,
  Barcode,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
} from "lucide-react";

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
    monthLabel: now.toLocaleString("en-MY", { month: "long", year: "numeric" }),
  };
}

export default function DashboardPage() {
  const { activeBranchId, branches } = useAppStore();
  const defaultRange = getCurrentMonthRange();

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"profit" | "revenue">("profit");

  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const fetchDashboard = async (sDate = startDate, eDate = endDate) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        idCabang: String(activeBranchId),
      });
      if (sDate) params.set("startDate", sDate);
      if (eDate) params.set("endDate", eDate);

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(startDate, endDate);
  }, [activeBranchId]);

  const ov = data?.overview || {
    grossRevenue: 0,
    totalDiscount: 0,
    totalTax: 0,
    netRevenue: 0,
    totalCogs: 0,
    totalNetProfit: 0,
    totalMarginPercent: 0,
    totalTransactions: 0,
    todayNetRevenue: 0,
    todayTaxRevenue: 0,
    todayGrossRevenue: 0,
    todayCogs: 0,
    todayNetProfit: 0,
    todayMarginPercent: 0,
    totalProducts: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
  };

  const lowStockProducts: any[] = data?.lowStockProducts || [];
  const dailyProfitLoss: any[] = data?.dailyProfitLoss || [];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Executive & Profit/Loss Dashboard
            </h1>
            <Badge variant="info" className="font-mono text-xs">
              {activeBranch?.code || `BR-0${activeBranchId}`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau performa penjualan, perputaran harga modal (COGS), dan laporan untung rugi bersih untuk{" "}
            <span className="font-semibold text-foreground">
              {activeBranch?.name || "Selected Branch"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/reports">View Detailed Reports</Link>
          </Button>
          <Button asChild variant="mecha" size="sm">
            <Link href="/pos">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Open POS Terminal
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Date Filter Bar */}
      <Card className="border-blue-200 bg-white shadow-2xs">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
            <div className="space-y-1 flex-1 max-w-[200px]">
              <Label className="flex items-center gap-1.5 text-blue-900 text-xs font-semibold">
                <CalendarRange className="h-3.5 w-3.5 text-blue-600" />
                From Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1 flex-1 max-w-[200px]">
              <Label className="text-blue-900 text-xs font-semibold">To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="mecha"
                size="sm"
                className="h-9 text-xs"
                onClick={() => fetchDashboard(startDate, endDate)}
              >
                Apply Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => {
                  const cur = getCurrentMonthRange();
                  setStartDate(cur.start);
                  setEndDate(cur.end);
                  fetchDashboard(cur.start, cur.end);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                This Month ({defaultRange.monthLabel})
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className="font-mono text-[11px] px-2.5 py-1"
            >
              Active Period: {startDate || "Start"} → {endDate || "Now"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Untung Rugi & Profitability KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Profit (Untung Bersih) */}
        <Card className="border-emerald-200 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Untung Bersih (Net Profit)
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-extrabold font-mono text-emerald-700">
                {formatRM(ov.totalNetProfit)}
              </div>
              <Badge
                variant="success"
                className="text-[10px] font-mono px-1.5 py-0.5"
              >
                {ov.totalMarginPercent}% Margin
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Untung Hari Ini:</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatRM(ov.todayNetProfit)} ({ov.todayMarginPercent}%)
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Modal Terjual (COGS) */}
        <Card className="border-amber-200 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Modal Terjual (COGS)
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shadow-xs">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-700">
              {formatRM(ov.totalCogs)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Modal Hari Ini:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatRM(ov.todayCogs)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Omzet Bersih (Net Revenue) */}
        <Card className="border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-sky-50/60 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Omzet Bersih (Net Sales)
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {formatRM(ov.netRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Omzet Hari Ini:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatRM(ov.todayNetRevenue)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Orders & Inventory */}
        <Card className="border-indigo-100 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Transaksi & Stok
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {ov.totalTransactions}{" "}
              <span className="text-xs font-sans font-normal text-slate-500">
                Transaksi
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Stok: {ov.totalUnitsInStock} unit</span>
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {ov.lowStockCount} tipis
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-8 border-blue-100 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                <Activity className="h-4 w-4 text-blue-600" />
                {chartMode === "profit"
                  ? "Tren Omzet, Modal & Keuntungan Bersih (MYR)"
                  : "Tren Gross vs. Net Revenue (MYR)"}
              </CardTitle>
              <CardDescription>
                Visualisasi tren harian ({startDate} s/d {endDate})
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setChartMode("profit")}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartMode === "profit"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Untung & Modal
              </button>
              <button
                type="button"
                onClick={() => setChartMode("revenue")}
                className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartMode === "revenue"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Gross vs Net
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[310px] w-full">
              {loading ? (
                <div className="h-full w-full rounded-xl bg-blue-50/50 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.chartData || []}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#cbd5e1"
                      opacity={0.5}
                    />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#bfdbfe",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "#0f172a",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(val: any, name: any) => [
                        formatRM(Number(val)),
                        name,
                      ]}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ fontSize: "11px", fontWeight: "600" }}
                    />
                    {chartMode === "profit" ? (
                      <>
                        <Area
                          type="monotone"
                          dataKey="netRevenue"
                          name="Omzet Bersih (RM)"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorNet)"
                        />
                        <Area
                          type="monotone"
                          dataKey="totalCost"
                          name="Modal Terjual (RM)"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCost)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netProfit"
                          name="Untung Bersih (RM)"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorProfit)"
                        />
                      </>
                    ) : (
                      <>
                        <Area
                          type="monotone"
                          dataKey="grossRevenue"
                          name="Gross Revenue (RM)"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorGross)"
                        />
                        <Area
                          type="monotone"
                          dataKey="netRevenue"
                          name="Net Revenue (RM)"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorNet)"
                        />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Gunpla Kits */}
        <Card className="lg:col-span-4 border-blue-100 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Gunpla Kits</CardTitle>
            <CardDescription>
              Produk terlaris pada periode yang dipilih
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.topProducts || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Belum ada penjualan pada periode ini.
              </p>
            ) : (
              (data?.topProducts || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Code: {item.productCode} • {item.totalQtySold} pcs terjual
                      </p>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-extrabold text-blue-700 shrink-0">
                    {formatRM(item.totalNetRevenue)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* DEDICATED REPORT UNTUNG RUGI HARIAN (DAILY PROFIT & LOSS REPORT) */}
      <Card className="border-blue-200 bg-white shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900">
                  Laporan Untung Rugi Harian (Daily Profit & Loss)
                </CardTitle>
                <CardDescription className="text-xs">
                  Rekap laba/rugi per hari dihitung otomatis dari{" "}
                  <span className="font-semibold text-slate-700">
                    Omzet Bersih − Harga Modal (COGS)
                  </span>{" "}
                  produk terjual
                </CardDescription>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
              Total {dailyProfitLoss.length} Hari Aktif
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal & Hari</th>
                  <th className="py-3 px-4 text-center">Transaksi</th>
                  <th className="py-3 px-4 text-right">Omzet Bersih</th>
                  <th className="py-3 px-4 text-right">Modal Terjual (COGS)</th>
                  <th className="py-3 px-4 text-right">Untung Bersih</th>
                  <th className="py-3 px-4 text-center">Margin (%)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyProfitLoss.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-500 text-xs"
                    >
                      Tidak ada transaksi dalam periode ini.
                    </td>
                  </tr>
                ) : (
                  dailyProfitLoss.map((row: any, idx: number) => {
                    const isProfitable = Number(row.netProfit) >= 0;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900">
                                {row.dateFormatted}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {row.dayName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-medium">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {row.totalTransactions}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {formatRM(row.netRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                          {formatRM(row.totalCost)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold">
                          <span
                            className={
                              isProfitable
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }
                          >
                            {isProfitable ? "+" : ""}
                            {formatRM(row.netProfit)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              isProfitable
                                ? "text-emerald-700 bg-emerald-50"
                                : "text-rose-700 bg-rose-50"
                            }`}
                          >
                            {row.profitMargin}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={isProfitable ? "success" : "destructive"}
                            className="text-[10px] font-mono px-2 py-0.5"
                          >
                            {isProfitable ? "PROFIT" : "LOSS"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {dailyProfitLoss.length > 0 && (
                <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-200">
                  <tr>
                    <td className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-700">
                      Grand Total Periode
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {ov.totalTransactions}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700">
                      {formatRM(ov.netRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">
                      {formatRM(ov.totalCogs)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                      {formatRM(ov.totalNetProfit)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-800">
                      {ov.totalMarginPercent}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="success"
                        className="text-[10px] font-mono px-2 py-0.5"
                      >
                        NET PROFIT
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert Products List on Dashboard */}
      <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/30 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alert Products (Stock ≤ 10 pcs)
            </CardTitle>
            <CardDescription>
              Produk di cabang ini dengan sisa stok menipis dan perlu restock
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/products">View All Products</Link>
            </Button>
            <Button asChild variant="mecha" size="sm">
              <Link href="/stock-in">
                <PackagePlus className="h-4 w-4 mr-1" />
                Restock Items
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Semua produk di cabang ini memiliki stok aman (&gt; 10 pcs).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.map((prod: any) => {
                const isOut = Number(prod.stock) <= 0;
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.image || "/images/gundam/rx78.svg"}
                        alt={prod.name}
                        className="h-12 w-14 rounded-lg object-cover border border-blue-100 bg-slate-950 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {prod.name}
                        </p>
                        <p className="text-[10px] font-mono text-blue-600 flex items-center gap-1 mt-0.5">
                          <Barcode className="h-3 w-3" />
                          {prod.productCode} • {formatRM(prod.price)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isOut ? "destructive" : "warning"}
                      className="font-mono text-xs shrink-0"
                    >
                      {isOut ? "Out (0)" : `${prod.stock} pcs`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
