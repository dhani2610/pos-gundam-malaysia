"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRM, formatDateTime } from "@/lib/utils";
import {
  printReceiptInline,
  downloadReceiptPdf,
} from "@/lib/pdf-printer";
import { useAppStore } from "@/store/use-app-store";
import {
  Printer,
  Download,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  ReceiptText,
} from "lucide-react";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any | null;
}

export function ReceiptModal({
  open,
  onOpenChange,
  transaction,
}: ReceiptModalProps) {
  const { settings } = useAppStore();

  if (!transaction) return null;

  const siteName =
    settings?.siteName || transaction.branchName || "GUNDAM BASE POS";
  const address =
    settings?.address ||
    transaction.branchAddress ||
    "Level 4, Bukit Bintang Plaza, Kuala Lumpur";
  const phone = settings?.phone || transaction.branchPhone || "+60 3-2148 8899";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  Transaction Complete
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 font-mono">
                  {transaction.invoiceNo}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-0 uppercase font-mono text-xs">
              {String(transaction.paymentMethod).replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Store Header Preview */}
          <div className="text-center border-b border-dashed border-border pb-3 space-y-1">
            <h4 className="font-extrabold text-sm tracking-wide uppercase">
              {siteName}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {address}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Tel: {phone}
            </p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg border border-border/60">
            <div className="space-y-1">
              <span className="text-muted-foreground block">Date & Time</span>
              <span className="font-semibold">
                {formatDateTime(transaction.createdAt)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block">Cashier</span>
              <span className="font-semibold">
                {transaction.cashierName || "Cashier"}
              </span>
            </div>
            <div className="space-y-1 col-span-2 pt-1 border-t border-border/50">
              <span className="text-muted-foreground block">Customer</span>
              <span className="font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                {transaction.customerName || "Walk-in Customer"}
                {transaction.customerPhone && (
                  <span className="text-muted-foreground font-mono">
                    ({transaction.customerPhone})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              <span>Purchased Items ({transaction.items?.length || 0})</span>
              <span>Subtotal (RM)</span>
            </div>
            <div className="divide-y divide-dashed divide-border border-y border-dashed border-border py-2 space-y-2">
              {(transaction.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">
                      {item.productName}
                    </div>
                    <div className="text-muted-foreground font-mono text-[11px]">
                      {item.qty} x {formatRM(item.customPrice)}
                      {Number(item.customPrice) !==
                        Number(item.originalPrice) && (
                        <span className="ml-1.5 text-amber-500">
                          (Catalog: {formatRM(item.originalPrice)})
                        </span>
                      )}
                      {Number(item.discountAmount) > 0 && (
                        <span className="ml-1.5 text-emerald-500">
                          • Disc: -{formatRM(item.discountAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-mono font-bold whitespace-nowrap">
                    {formatRM(item.netSubtotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross Total</span>
              <span className="font-mono">
                {formatRM(transaction.grossTotal)}
              </span>
            </div>
            {Number(transaction.itemDiscountTotal || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Item Discounts</span>
                <span className="font-mono">
                  -{formatRM(transaction.itemDiscountTotal)}
                </span>
              </div>
            )}
            {Number(transaction.voucherDiscountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Promo Voucher
                  {transaction.voucherCode ? ` (${transaction.voucherCode})` : ""}
                </span>
                <span className="font-mono">
                  -{formatRM(transaction.voucherDiscountAmount)}
                </span>
              </div>
            )}
            {Number(transaction.orderDiscountAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>
                  Receipt / Total Discount
                  {transaction.orderDiscountType === "percent"
                    ? ` (${Number(transaction.orderDiscountValue)}%)`
                    : ""}
                </span>
                <span className="font-mono">
                  -{formatRM(transaction.orderDiscountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Total Combined Discount</span>
              <span className="font-mono">
                -{formatRM(transaction.discountTotal)}
              </span>
            </div>
            {Number(transaction.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-blue-950 font-semibold">
                <span>
                  Tax / SST ({Number(transaction.taxPercentage || 0)}%)
                </span>
                <span className="font-mono text-blue-700 font-bold">
                  +{formatRM(transaction.taxAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold pt-2 border-t border-border">
              <span>NET TOTAL</span>
              <span className="font-mono text-primary">
                {formatRM(transaction.netTotal)}
              </span>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs border border-border/60">
            {transaction.paymentMethod === "cash" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Amount Paid</span>
                <span className="font-mono font-semibold">
                  {formatRM(transaction.cashAmount)}
                </span>
              </div>
            )}
            {transaction.paymentMethod === "transfer" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Bank Transfer Amount
                </span>
                <span className="font-mono font-semibold">
                  {formatRM(transaction.transferAmount)}
                </span>
              </div>
            )}
            {transaction.paymentMethod === "qr_pay" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">QR Pay Amount</span>
                <span className="font-mono font-semibold">
                  {formatRM(transaction.transferAmount || transaction.netTotal)}
                </span>
              </div>
            )}
            {transaction.bankAccountInfo && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank Account</span>
                <span className="font-medium text-right">
                  {transaction.bankAccountInfo}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-border/60 font-bold">
              <span>Change Due</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatRM(transaction.changeAmount)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t border-border flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadReceiptPdf(transaction, settings)}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            Save PDF
          </Button>
          <Button
            type="button"
            variant="mecha"
            size="sm"
            onClick={() => printReceiptInline(transaction, settings)}
            className="flex-1"
          >
            <Printer className="h-4 w-4" />
            Print Receipt (Inline)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
