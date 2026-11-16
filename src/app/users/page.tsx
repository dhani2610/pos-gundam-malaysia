"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAppStore } from "@/store/use-app-store";
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
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";

export default function UsersPage() {
  const { activeBranchId, branches, user: currentUser } = useAppStore();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [form, setForm] = useState({
    id: 0,
    idCabang: String(activeBranchId),
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    role: "employee" as "admin" | "employee" | "admin_stok",
  });

  const loadData = async () => {
    const res = await fetch(`/api/users?idCabang=${activeBranchId}`);
    const json = await res.json();
    if (json.success) setUsersList(json.data || []);
  };

  useEffect(() => {
    loadData();
  }, [activeBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: form.id || undefined,
          idCabang: Number(form.idCabang),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(form.id ? "User updated!" : "User account created!");
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/users?id=${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      toast.success(`User "${deleteTarget.name}" moved to Trash`);
      setDeleteTarget(null);
      loadData();
    } else {
      toast.error(json.message);
    }
  };

  const handleBulkDelete = async (selected: any[]) => {
    const deletable = selected.filter((u) => u.id !== currentUser?.id);
    if (deletable.length === 0) {
      toast.error("You cannot move your own active account to Trash");
      return;
    }
    await Promise.all(
      deletable.map((row) =>
        fetch(`/api/users?id=${row.id}`, { method: "DELETE" })
      )
    );
    toast.success(`Moved ${deletable.length} user(s) to Trash`);
    loadData();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Full Name",
      cell: ({ row }) => (
        <span className="font-bold text-xs">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "username",
      header: "Username (Login)",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          @{row.original.username}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const r = row.original.role;
        return (
          <Badge
            variant={
              r === "admin"
                ? "info"
                : r === "admin_stok"
                  ? "warning"
                  : "success"
            }
            className="uppercase font-mono text-[10px]"
          >
            {r === "employee"
              ? "EMPLOYEE (CASHIER)"
              : r === "admin_stok"
                ? "ADMIN STOK"
                : "ADMIN"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email Address",
      cell: ({ row }) => (
        <span className="text-xs flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-muted-foreground" />
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-muted-foreground" />
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.branchName}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setForm({
                id: row.original.id,
                idCabang: String(row.original.idCabang),
                username: row.original.username,
                password: "",
                name: row.original.name,
                email: row.original.email,
                phone: row.original.phone,
                role: row.original.role,
              });
              setModalOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-amber-500" />
          </Button>
          {row.original.id !== currentUser?.id && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User & Cashier Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage Admin and Employee (Cashier) accounts with Username,
            Password, Email, Phone, and Branch assignment
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({
              id: 0,
              idCabang: String(activeBranchId),
              username: "",
              password: "",
              name: "",
              email: "",
              phone: "+60 ",
              role: "employee",
            });
            setModalOpen(true);
          }}
          variant="mecha"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add User / Cashier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={usersList}
        searchPlaceholder="Search name, username, email, phone, or role..."
        onBulkDelete={handleBulkDelete}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Move User Account to Trash?"
        itemName={
          deleteTarget ? `${deleteTarget.name} (@${deleteTarget.username})` : ""
        }
        onConfirm={confirmSingleDelete}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit User Account" : "Create User Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select
                  value={form.role}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      role: val as "admin" | "employee" | "admin_stok",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee (Cashier)</SelectItem>
                    <SelectItem value="admin_stok">
                      Admin Stok (Product Items Only)
                    </SelectItem>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Branch *</Label>
                <Select
                  value={form.idCabang}
                  onValueChange={(val) => setForm({ ...form, idCabang: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Suletta Mercury"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Login Username *</Label>
                <Input
                  placeholder="e.g. suletta"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {form.id ? "New Password (Optional)" : "Password *"}
                </Label>
                <Input
                  type="password"
                  placeholder={form.id ? "Leave blank to keep" : "••••••••"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required={!form.id}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="staff@gundambase.my"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+60 12-345 6789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="mecha">
                Save User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
