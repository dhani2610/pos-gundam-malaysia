"use client";

import React, { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Settings,
  Upload,
  Landmark,
  Plus,
  Trash2,
  Save,
  Building2,
  Percent,
  Receipt,
  BadgePercent,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const { activeBranchId, setSettings } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [siteName, setSiteName] = useState("GUNDAM BASE KUALA LUMPUR HQ");
  const [logoUrl, setLogoUrl] = useState("/images/gundam/logo.svg");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [secondaryBanks, setSecondaryBanks] = useState<
    Array<{ bankName: string; accountNumber: string; accountHolder: string }>
  >([]);
  const [receiptFooter, setReceiptFooter] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState("6.00");
  const [taxName, setTaxName] = useState("SST");

  useEffect(() => {
    fetch(`/api/settings?idCabang=${activeBranchId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const d = json.data;
          setSiteName(d.siteName || "");
          setLogoUrl(d.logoUrl || "/images/gundam/logo.svg");
          setAddress(d.address || "");
          setPhone(d.phone || "");
          setEmail(d.email || "");
          setBankName(d.bankName || "");
          setBankAccountNumber(d.bankAccountNumber || "");
          setBankAccountHolder(d.bankAccountHolder || "");
          setSecondaryBanks(
            Array.isArray(d.secondaryBanks) ? d.secondaryBanks : []
          );
          setReceiptFooter(d.receiptFooter || "");
          setTaxEnabled(Boolean(d.taxEnabled));
          setTaxPercentage(
            d.taxPercentage !== undefined && d.taxPercentage !== null
              ? String(d.taxPercentage)
              : "6.00"
          );
          setTaxName(d.taxName || "SST");
        }
      });
  }, [activeBranchId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setLogoUrl(json.url);
      toast.success("Website logo uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCabang: activeBranchId,
          siteName,
          logoUrl,
          address,
          phone,
          email,
          bankName,
          bankAccountNumber,
          bankAccountHolder,
          secondaryBanks,
          receiptFooter,
          taxEnabled,
          taxPercentage: parseFloat(taxPercentage) || 0,
          taxName,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSettings(json.data);
      toast.success("Website & Bank Payment Settings saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Website & Payment Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure store branding, receipt letterhead (Kop), address, and bank
          accounts for Transfer / QR Pay POS payments
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding & Store Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Store Identity & Receipt Header (Kop)
            </CardTitle>
            <CardDescription>
              Used across the top navbar, thermal receipts, and official A4 PDF
              reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
              <img
                src={logoUrl || "/images/gundam/logo.svg"}
                alt="Store Logo"
                className="h-16 w-16 rounded-xl object-cover border border-border bg-slate-950"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <Input
                  placeholder="Logo URL..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Website / Store Name *</Label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Full Branch / Store Address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Receipt Footer Note</Label>
              <Input
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for shopping at Gundam Base!"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax & SST (Sales & Service Tax) Settings */}
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2 text-blue-950">
                  <BadgePercent className="h-4 w-4 text-primary" />
                  Tax & SST (Sales & Service Tax) Settings
                </CardTitle>
                <CardDescription>
                  Configure automated tax percentage on checkout. When enabled, tax is automatically calculated, shown in POS cart, printed on receipts, and tracked in sales reports.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {taxEnabled ? "TAX ACTIVE" : "TAX OFF"}
                </span>
                <button
                  type="button"
                  onClick={() => setTaxEnabled(!taxEnabled)}
                  className={`h-8 px-4 rounded-lg text-xs font-extrabold transition-all shadow-xs ${
                    taxEnabled
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {taxEnabled ? "Enabled (ON)" : "Disabled (OFF)"}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">
                  Tax / SST Rate (% Percentage) *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    placeholder="e.g. 6.00 or 8.00"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    className="h-9 font-mono font-bold text-xs pr-8"
                    disabled={!taxEnabled}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Standard Malaysia SST is typically 6% or 8%.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800">
                  Tax Label / Name on Receipts *
                </Label>
                <Input
                  placeholder="e.g. SST or Sales Tax"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="h-9 text-xs"
                  disabled={!taxEnabled}
                />
                <p className="text-[11px] text-slate-500">
                  Label printed on thermal receipts (e.g. "SST (6%)").
                </p>
              </div>
            </div>

            {taxEnabled && (
              <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{taxName || "Tax"} ({taxPercentage || "0"}%)</strong> will be applied automatically to all POS cart checkouts for this store.
                  </span>
                </div>
                <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-300">
                  Sample: RM 100.00 → +RM {((100 * (parseFloat(taxPercentage) || 0)) / 100).toFixed(2)} Tax
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Payment Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                Bank Payment Accounts
              </CardTitle>
              <CardDescription>
                Displayed during Transfer and QR Pay checkout in POS
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSecondaryBanks((prev) => [
                  ...prev,
                  { bankName: "", accountNumber: "", accountHolder: "" },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Another Bank
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-primary/30 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Primary Bank Account
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Bank Name *</Label>
                  <Input
                    placeholder="e.g. Maybank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number *</Label>
                  <Input
                    placeholder="e.g. 514012349988"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Holder Name *</Label>
                  <Input
                    placeholder="e.g. GUNDAM BASE MALAYSIA SDN BHD"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {secondaryBanks.map((bank, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-muted/20 border border-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Additional Bank #{idx + 2}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSecondaryBanks((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="h-7 text-xs text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Bank Name</Label>
                    <Input
                      value={bank.bankName}
                      onChange={(e) =>
                        setSecondaryBanks((prev) =>
                          prev.map((b, i) =>
                            i === idx ? { ...b, bankName: e.target.value } : b
                          )
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Account Number</Label>
                    <Input
                      value={bank.accountNumber}
                      onChange={(e) =>
                        setSecondaryBanks((prev) =>
                          prev.map((b, i) =>
                            i === idx
                              ? { ...b, accountNumber: e.target.value }
                              : b
                          )
                        )
                      }
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Account Holder Name</Label>
                    <Input
                      value={bank.accountHolder}
                      onChange={(e) =>
                        setSecondaryBanks((prev) =>
                          prev.map((b, i) =>
                            i === idx
                              ? { ...b, accountHolder: e.target.value }
                              : b
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="mecha"
            size="lg"
            disabled={loading}
            className="font-bold"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {loading ? "Saving..." : "Save Website Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
