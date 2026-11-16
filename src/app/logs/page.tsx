"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { ScrollText, Eye, ShieldAlert } from "lucide-react";

export default function LogsPage() {
  const { activeBranchId } = useAppStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    fetch(`/api/logs?idCabang=${activeBranchId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setLogs(json.data || []);
      });
  }, [activeBranchId]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: "user_name",
      header: "Actor / User",
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-bold">{row.original.user_name || "System"}</div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">
            {row.original.user_role}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.module}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Action Type",
      cell: ({ row }) => {
        const act = String(row.original.action);
        const variant =
          act.includes("DELETE") || act.includes("OVERRIDE")
            ? "destructive"
            : act.includes("EDIT") || act.includes("UPDATE")
              ? "warning"
              : act.includes("RESTORE") || act.includes("CREATE")
                ? "success"
                : "info";
        return (
          <Badge variant={variant} className="font-mono text-[10px]">
            {act}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Audit Trail Description",
      cell: ({ row }) => (
        <div className="text-xs max-w-[460px] leading-relaxed">
          {row.original.description}
        </div>
      ),
    },
    {
      id: "details",
      header: "Payload",
      cell: ({ row }) =>
        row.original.metadata ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedLog(row.original)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Inspect
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          System Activity & Anti-Fraud Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          Every login, POS price override, transaction edit, stock adjustment,
          and soft-deletion is permanently recorded with actor identity
        </p>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchPlaceholder="Search logs by user, action (e.g. PRICE_OVERRIDE, SOFT_DELETE), module, or invoice..."
      />

      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(o) => !o && setSelectedLog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Audit Payload — {selectedLog?.module} ({selectedLog?.action})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <p className="font-medium">{selectedLog?.description}</p>
            <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(selectedLog?.metadata || "{}"),
                    null,
                    2
                  );
                } catch {
                  return selectedLog?.metadata;
                }
              })()}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
