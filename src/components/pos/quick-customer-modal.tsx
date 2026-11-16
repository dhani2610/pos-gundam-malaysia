"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface QuickCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idCabang: number;
  onCreated: (customer: {
    id: number;
    name: string;
    phone: string;
    address?: string;
  }) => void;
}

export function QuickCustomerModal({
  open,
  onOpenChange,
  idCabang,
  onCreated,
}: QuickCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Customer name and phone number are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCabang,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to add customer");
      }
      toast.success(`Customer "${json.data.name}" added & selected!`);
      onCreated(json.data);
      setName("");
      setPhone("");
      setAddress("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Quick Add Customer
          </DialogTitle>
          <DialogDescription>
            Register a new customer directly from the POS terminal and link them
            to this order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer Full Name *</Label>
            <Input
              placeholder="e.g. Hathaway Noa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number *</Label>
            <Input
              placeholder="e.g. +60 12-345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address (Optional)</Label>
            <Textarea
              placeholder="Customer shipping or billing address (optional)..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="mecha" disabled={loading}>
              {loading ? "Saving..." : "Save & Select Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
