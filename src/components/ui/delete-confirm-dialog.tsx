"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  ArchiveRestore,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Move to Trash?",
  itemName,
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-blue-100 shadow-2xl">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-5 text-white flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <Trash2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-extrabold text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-red-100 mt-0.5">
              Move item to Trash Bin
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-white">
          <div className="text-sm text-slate-700 leading-relaxed">
            Are you sure you want to move{" "}
            {itemName ? (
              <span className="font-bold text-slate-900">"{itemName}"</span>
            ) : (
              "this item"
            )}{" "}
            to Trash?
            {description && (
              <span className="block text-xs text-slate-500 mt-1.5">
                {description}
              </span>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
            <ArchiveRestore className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              This data will be stored in the <strong>Trash Data</strong> menu
              and can be restored anytime.
            </span>
          </div>

          <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-600/20"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {loading ? "Moving to Trash..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  moduleName?: string;
  onConfirm: () => Promise<void> | void;
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  title = "Restore Data from Trash?",
  itemName,
  moduleName,
  onConfirm,
}: RestoreConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-blue-100 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <ArchiveRestore className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-extrabold text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-blue-100 mt-0.5">
              Recover record back to active list
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-white">
          <div className="text-sm text-slate-700 leading-relaxed">
            Are you sure you want to restore{" "}
            {itemName ? (
              <span className="font-bold text-slate-900">"{itemName}"</span>
            ) : (
              "the selected record(s)"
            )}
            {moduleName ? (
              <>
                {" "}
                back to <strong>{moduleName}</strong>
              </>
            ) : null}
            ?
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Once restored, this data will immediately become active again in
              its module and reports.
            </span>
          </div>

          <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="mecha"
              onClick={handleConfirm}
              disabled={loading}
              className="font-bold"
            >
              <ArchiveRestore className="h-4 w-4 mr-1.5" />
              {loading ? "Restoring..." : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PermanentDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
}

export function PermanentDeleteConfirmDialog({
  open,
  onOpenChange,
  title = "Permanently Delete Data?",
  itemName,
  onConfirm,
}: PermanentDeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-red-200 shadow-2xl">
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-5 text-white flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-extrabold text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-red-100 mt-0.5">
              Permanent removal from Trash Bin
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-white">
          <div className="text-sm text-slate-700 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            {itemName ? (
              <span className="font-bold text-slate-900">"{itemName}"</span>
            ) : (
              "the selected item(s)"
            )}{" "}
            from Trash?
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              <strong>Warning:</strong> This record will be permanently removed
              from the database and cannot be recovered anymore.
            </span>
          </div>

          <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 font-bold shadow-md shadow-red-600/20"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {loading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
