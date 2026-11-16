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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCircle, Save, KeyRound } from "lucide-react";

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.user) {
          setName(json.user.name || "");
          setUsername(json.user.username || "");
          setEmail(json.user.email || "");
          setPhone(json.user.phone || "");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setUser(json.user);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          Edit My Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Update your personal account information, contact details, and login
          password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Account Information</CardTitle>
                <CardDescription>
                  Your active role and contact details
                </CardDescription>
              </div>
              <Badge variant="info" className="uppercase font-mono">
                {user?.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Login Username *</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Change Password (Optional)
            </CardTitle>
            <CardDescription>
              Leave blank if you do not wish to change your password
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="mecha" disabled={loading}>
            <Save className="h-4 w-4 mr-1.5" />
            {loading ? "Saving..." : "Save Profile Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
