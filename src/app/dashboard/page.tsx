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
    netRevenue: 0,
    totalTransactions: 0,
    todayNetRevenue: 0,
    todayGrossRevenue: 0,
    totalProducts: 0,
    totalUnitsInStock: 0,
    lowStockCount: 0,
  };

  const lowStockProducts: any[] = data?.lowStockProducts || [];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Revenue & Executive Dashboard
            </h1>
            <Badge variant="info" className="font-mono text-xs">
              {activeBranch?.code || `BR-0${activeBranchId}`}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Showing financial performance (Gross vs. Net Revenue in MYR) for{" "}
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

      {/* Dashboard Date Filter Bar (Defaults to Current Running Month) */}
      <Card className="border-blue-200 bg-white shadow-2xs">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-1">
            <div className="space-y-1 flex-1 max-w-[200px]">
              <Label className="flex items-center gap-1.5 text-blue-900">
                <CalendarRange className="h-3.5 w-3.5 text-blue-600" />
                From Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1 flex-1 max-w-[200px]">
              <Label className="text-blue-900">To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="mecha"
                size="sm"
                className="h-9"
                onClick={() => fetchDashboard(startDate, endDate)}
              >
                Apply Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
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

      {/* Primary Revenue KPI Cards (Gross Revenue vs Net Revenue) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/80 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Revenue (Clean)
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-blue-700">
              {formatRM(ov.netRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Today Net:{" "}
              <span className="font-mono font-bold text-slate-900">
                {formatRM(ov.todayNetRevenue)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-white to-sky-50/80 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Revenue
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-sky-700">
              {formatRM(ov.grossRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Today Gross:{" "}
              <span className="font-mono font-bold text-slate-900">
                {formatRM(ov.todayGrossRevenue)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Discounts Given
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Tag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-amber-600">
              {formatRM(ov.totalDiscount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across{" "}
              <span className="font-mono font-bold text-slate-900">
                {ov.totalTransactions}
              </span>{" "}
              transactions in period
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Branch Inventory
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {ov.totalUnitsInStock}{" "}
              <span className="text-xs font-sans font-normal text-slate-500">
                units ({ov.totalProducts} SKUs)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>{ov.lowStockCount} items with low stock (≤10)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart & Top Selling Gunpla */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-8 border-blue-100">
          <CardHeader>
            <CardTitle className="text-base">
              Gross vs. Net Revenue Trend (MYR)
            </CardTitle>
            <CardDescription>
              Daily sales performance for the selected period ({startDate} to{" "}
              {endDate})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[310px] w-full">
              {loading ? (
                <div className="h-full w-full rounded-xl bg-blue-50/50 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.chartData || []}>
                    <defs>
                      <linearGradient
                        id="colorGross"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0ea5e9"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0ea5e9"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
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
                      }}
                    />
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
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-blue-100">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Gunpla Kits</CardTitle>
            <CardDescription>
              Best performing items in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.topProducts || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No sales recorded in this period.
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
                        Code: {item.productCode} • {item.totalQtySold} sold
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

      {/* Low Stock Alert Products List on Dashboard */}
      <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50/30">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Low Stock Alert Products (Stock ≤ 10 pcs)
            </CardTitle>
            <CardDescription>
              Products in this branch that are running out of stock and need
              restocking
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
              All products in this branch have healthy stock levels (&gt; 10
              pcs).
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
