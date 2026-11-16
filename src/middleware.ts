import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("pos_gundam_token")?.value;
  const user = token ? await verifySessionToken(token) : null;

  // Handle API routes
  if (pathname.startsWith("/api")) {
    if (pathname.startsWith("/api/auth/login")) {
      return NextResponse.next();
    }
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Unauthenticated users MUST log in first
  if (!user) {
    if (pathname !== "/login") {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Authenticated user visiting "/" or "/login" -> redirect to home based on role
  if (pathname === "/" || pathname === "/login") {
    const target =
      user.role === "admin_stok"
        ? "/products"
        : user.role === "employee"
          ? "/pos"
          : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // Role-based access restriction for Employee (Cashier)
  if (user.role === "employee") {
    const allowedEmployeePaths = [
      "/pos",
      "/transactions",
      "/reports",
      "/customers",
      "/profile",
    ];
    const isAllowed = allowedEmployeePaths.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/pos", req.url));
    }
  }

  // Role-based access restriction for Admin Stok (Only /products and /profile)
  if (user.role === "admin_stok") {
    const allowedStockAdminPaths = ["/products", "/profile"];
    const isAllowed = allowedStockAdminPaths.some((p) =>
      pathname.startsWith(p)
    );
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/products", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
