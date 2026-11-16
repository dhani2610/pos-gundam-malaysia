"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";
import { Lock, User, ShieldCheck, ShoppingCart, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Invalid credentials");
      }

      setUser(json.user);
      toast.success(`Welcome back, ${json.user.name}!`);
      if (json.user.role === "admin_stok") {
        router.replace("/products");
      } else if (json.user.role === "employee") {
        router.replace("/pos");
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden p-4">
      {/* Subtle Blue Tech Pattern Background */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(37,99,235,0.18) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-white border-2 border-blue-200 shadow-lg shadow-blue-500/10 mb-1">
            <img
              src="/images/gundam/logo.svg"
              alt="Gundam Base POS"
              className="h-14 w-14 rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-950">
            GUNDAM BASE POS
          </h1>
          <p className="text-xs text-blue-600 font-mono font-semibold uppercase tracking-widest">
            Multi-Branch Retail & Inventory Terminal
          </p>
        </div>

        <Card className="border-blue-200 bg-white/95 backdrop-blur-xl shadow-xl shadow-blue-900/5 overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">
              Sign In to Terminal
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter your staff username and password to access your branch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    placeholder="Enter username (e.g. admin or cashier)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 h-10 bg-blue-50/40 border-blue-200 text-slate-900 focus-visible:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 h-10 bg-blue-50/40 border-blue-200 text-slate-900 focus-visible:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="mecha"
                size="lg"
                className="w-full font-bold h-11"
                disabled={loading}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                {loading ? "Authenticating..." : "Sign In to POS"}
              </Button>
            </form>

            {/* Quick Demo Login Cards */}
            <div className="pt-3 border-t border-blue-100 space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 text-center">
                Quick Demo Accounts (Click to Autofill)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo("admin", "admin123")}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-400 text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-blue-600 text-white border-0 text-[9px] px-1.5 py-0">
                      ADMIN
                    </Badge>
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-900">
                    admin / admin123
                  </div>
                  <div className="text-[9px] text-slate-600">
                    Full Access
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("cashier", "cashier123")}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-400 text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-emerald-600 text-white border-0 text-[9px] px-1.5 py-0">
                      EMPLOYEE
                    </Badge>
                    <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-900">
                    cashier / cashier123
                  </div>
                  <div className="text-[9px] text-slate-600">
                    POS & Own Report
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("stockadmin", "stock123")}
                  className="p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-400 text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className="bg-amber-600 text-white border-0 text-[9px] px-1.5 py-0">
                      ADMIN STOK
                    </Badge>
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="font-mono text-[11px] font-bold text-slate-900">
                    stockadmin / stock123
                  </div>
                  <div className="text-[9px] text-slate-600">
                    Products Only
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
