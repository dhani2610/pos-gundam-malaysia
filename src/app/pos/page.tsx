"use client";

import React from "react";
import { PosWorkspace } from "@/components/pos/pos-workspace";
import { useAppStore } from "@/store/use-app-store";
import { Badge } from "@/components/ui/badge";
import { Barcode, Sparkles } from "lucide-react";

export default function PosPage() {
  const { activeBranchId, branches } = useAppStore();
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">
              POS Cashier Terminal
            </h1>
            <Badge variant="success" className="font-mono text-[11px]">
              <Barcode className="h-3 w-3 mr-1" />
              Scanner Ready
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Active Branch:{" "}
            <span className="font-semibold text-foreground">
              {activeBranch?.name || `Branch #${activeBranchId}`}
            </span>{" "}
            • Scan any product barcode or click product cards to add to cart
          </p>
        </div>
      </div>

      <PosWorkspace />
    </div>
  );
}
