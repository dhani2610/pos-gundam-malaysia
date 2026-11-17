"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  BarChart3,
  Package,
  PackagePlus,
  Layers,
  GitBranch,
  Award,
  Users,
  UserCheck,
  Building2,
  Settings,
  ScrollText,
  Trash2,
  UserCircle,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"admin" | "employee" | "admin_stok">;
  group: "Operations" | "Catalog & Stock" | "Administration";
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Revenue Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
    group: "Operations",
  },
  {
    title: "POS Terminal",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["admin", "employee"],
    group: "Operations",
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Receipt,
    roles: ["admin", "employee"],
    group: "Operations",
  },
  {
    title: "Sales Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["admin", "employee"],
    group: "Operations",
  },
  {
    title: "Customers",
    href: "/customers",
    icon: UserCheck,
    roles: ["admin", "employee"],
    group: "Operations",
  },
  {
    title: "Discount Vouchers",
    href: "/vouchers",
    icon: Ticket,
    roles: ["admin"],
    group: "Operations",
  },
  {
    title: "Product Items",
    href: "/products",
    icon: Package,
    roles: ["admin", "admin_stok"],
    group: "Catalog & Stock",
  },
  {
    title: "Product Stock In",
    href: "/stock-in",
    icon: PackagePlus,
    roles: ["admin"],
    group: "Catalog & Stock",
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Layers,
    roles: ["admin"],
    group: "Catalog & Stock",
  },
  {
    title: "Sub Categories",
    href: "/sub-categories",
    icon: GitBranch,
    roles: ["admin"],
    group: "Catalog & Stock",
  },
  {
    title: "Brands",
    href: "/brands",
    icon: Award,
    roles: ["admin"],
    group: "Catalog & Stock",
  },
  {
    title: "Master Branches",
    href: "/branches",
    icon: Building2,
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Website Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Activity Logs",
    href: "/logs",
    icon: ScrollText,
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Trash Data",
    href: "/trash",
    icon: Trash2,
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Edit Profile",
    href: "/profile",
    icon: UserCircle,
    roles: ["admin", "employee", "admin_stok"],
    group: "Administration",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    setUser,
    activeBranchId,
    setActiveBranchId,
    branches,
    setBranches,
    settings,
    setSettings,
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useAppStore();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Hydrate user session & branches on mount
  useEffect(() => {
    if (pathname === "/login") {
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;
    async function hydrate() {
      try {
        const [meRes, brRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/branches"),
        ]);
        const meJson = await meRes.json();
        if (!meJson.success || !meJson.user) {
          if (!cancelled) {
            setUser(null);
            router.replace("/login");
          }
          return;
        }
        if (!cancelled) {
          setUser(meJson.user);
        }

        const brJson = await brRes.json();
        if (!cancelled && brJson.success && Array.isArray(brJson.data)) {
          setBranches(brJson.data);
        }

        if (meJson.user.role === "employee") {
          const allowedPaths = [
            "/pos",
            "/transactions",
            "/reports",
            "/customers",
            "/profile",
          ];
          if (!allowedPaths.some((p) => pathname.startsWith(p))) {
            router.replace("/pos");
          }
        } else if (meJson.user.role === "admin_stok") {
          const allowedPaths = ["/products", "/profile"];
          if (!allowedPaths.some((p) => pathname.startsWith(p))) {
            router.replace("/products");
          }
        }
        if (!cancelled) {
          setCheckingAuth(false);
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Fetch Website Settings whenever activeBranchId changes
  useEffect(() => {
    if (!activeBranchId || pathname === "/login" || !user) return;
    fetch(`/api/settings?idCabang=${activeBranchId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {});
  }, [activeBranchId, pathname, user]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-700">
          Verifying Session...
        </p>
      </div>
    );
  }

  const role = user.role || "employee";
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = Array.from(new Set(visibleNav.map((i) => i.group)));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  // Primary Bottom Bar Menus for Mobile App View
  const mobileBottomItems =
    role === "admin"
      ? [
          { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          { title: "POS", href: "/pos", icon: ShoppingCart },
          { title: "Orders", href: "/transactions", icon: Receipt },
          { title: "Reports", href: "/reports", icon: BarChart3 },
        ]
      : role === "admin_stok"
        ? [
            { title: "Products", href: "/products", icon: Package },
            { title: "Profile", href: "/profile", icon: UserCircle },
          ]
        : [
            { title: "POS", href: "/pos", icon: ShoppingCart },
            { title: "Orders", href: "/transactions", icon: Receipt },
            { title: "Reports", href: "/reports", icon: BarChart3 },
            { title: "Profile", href: "/profile", icon: UserCircle },
          ];

  const renderSidebarLinks = (isMobile = false) => (
    <div className="space-y-5 py-3 px-3">
      {groups.map((grp) => {
        const items = visibleNav.filter((i) => i.group === grp);
        return (
          <div key={grp} className="space-y-1">
            {(!sidebarCollapsed || isMobile) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-blue-900/50 mb-1.5">
                {grp}
              </p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 font-semibold"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
                    sidebarCollapsed && !isMobile && "justify-center px-2"
                  )}
                  title={item.title}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {(!sidebarCollapsed || isMobile) && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar (Clean White & Royal Blue Accent) */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-blue-100 bg-white shadow-sm transition-all duration-200 shrink-0 sticky top-0 h-screen z-30",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="h-16 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between px-4">
          <Link
            href={role === "admin" ? "/dashboard" : "/pos"}
            className="flex items-center gap-3 overflow-hidden"
          >
            <img
              src={settings?.logoUrl || "/images/gundam/logo.svg"}
              alt="Logo"
              className="h-9 w-9 rounded-xl object-cover shrink-0 border border-white/30 bg-white"
            />
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight block truncate text-white">
                  {settings?.siteName || "GUNDAM BASE POS"}
                </span>
                <span className="text-[10px] font-mono text-blue-100 uppercase tracking-wider block">
                  RX-78 Retail System
                </span>
              </div>
            )}
          </Link>
        </div>

        <ScrollArea className="flex-1">{renderSidebarLinks(false)}</ScrollArea>

        <div className="p-3 border-t border-blue-100 bg-blue-50/40">
          {!sidebarCollapsed ? (
            <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-blue-600 font-mono">
                  @{user.username} • {role.toUpperCase()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50 shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="w-full h-9 text-destructive"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Out Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-white">
          <SheetHeader className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-left">
            <div className="flex items-center gap-3">
              <img
                src={settings?.logoUrl || "/images/gundam/logo.svg"}
                alt="Logo"
                className="h-9 w-9 rounded-xl object-cover border border-white/30 bg-white"
              />
              <div className="truncate">
                <SheetTitle className="text-sm font-extrabold truncate text-white">
                  {settings?.siteName || "GUNDAM BASE POS"}
                </SheetTitle>
                <p className="text-[11px] text-blue-100 font-mono">
                  {user.name} ({role.toUpperCase()})
                </p>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">{renderSidebarLinks(true)}</ScrollArea>
          <div className="p-4 border-t border-blue-100">
            <Button
              variant="destructive"
              className="w-full"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Top Navbar Header (Crisp White & Blue Border) */}
        <header className="h-16 border-b border-blue-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 px-4 lg:px-6 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            {/* Mobile Sidebar Drawer Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden h-9 w-9 border-blue-200 text-blue-700"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Desktop Sidebar Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex h-9 w-9 text-blue-700 hover:bg-blue-50"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <Badge className="font-mono text-[11px] px-2.5 py-0.5 bg-blue-600 text-white border-0">
                MYR (RM)
              </Badge>
              <Badge
                variant="outline"
                className="font-mono text-[11px] px-2.5 py-0.5 capitalize border-blue-200 bg-blue-50/60 text-blue-800"
              >
                <ShieldCheck className="h-3 w-3 mr-1 text-blue-600" />
                {role} Mode
              </Badge>
            </div>
          </div>

          {/* Right Header Controls: Branch Selector + User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600 hidden sm:inline" />
              <Select
                value={String(activeBranchId)}
                onValueChange={(val) => {
                  const id = Number(val);
                  setActiveBranchId(id);
                  const found = branches.find((b) => b.id === id);
                  toast.info(
                    `Switched active branch to ${found?.name || `Branch #${id}`}`
                  );
                }}
              >
                <SelectTrigger className="w-[180px] sm:w-[250px] h-9 text-xs font-semibold bg-blue-50/50 border-blue-200 text-slate-900">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem
                      key={b.id}
                      value={String(b.id)}
                      className="text-xs"
                    >
                      <span className="font-mono text-[10px] text-blue-600 font-bold mr-1.5">
                        [{b.code}]
                      </span>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 px-2.5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-100/60"
                >
                  <Avatar className="h-7 w-7 border border-blue-300">
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                      {user.name?.slice(0, 2).toUpperCase() || "GB"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[130px] truncate">
                    {user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      @{user.username} ({role.toUpperCase()})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                {role !== "admin_stok" && (
                  <DropdownMenuItem onClick={() => router.push("/pos")}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    POS Terminal
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Native-App-Like Bottom Navigation Bar (Blue & White) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-lg border-t border-blue-100 flex items-center justify-around px-2 shadow-xl">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all",
                active
                  ? "text-blue-600 font-bold"
                  : "text-slate-500 hover:text-blue-600"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  active && "bg-blue-100/80 text-blue-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] tracking-tight">{item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-slate-500 hover:text-blue-600"
        >
          <div className="p-1.5 rounded-lg">
            <Menu className="h-4 w-4" />
          </div>
          <span className="text-[10px] tracking-tight">All Menus</span>
        </button>
      </nav>
    </div>
  );
}
