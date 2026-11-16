import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gundam-rx78-pos-secret-key-2026-ultra-fast"
);

export type UserRole = "admin" | "employee" | "admin_stok";

export interface SessionUser {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  idCabang: number;
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rawRole = String(payload.role || "employee");
    const role: UserRole =
      rawRole === "admin"
        ? "admin"
        : rawRole === "admin_stok"
          ? "admin_stok"
          : "employee";
    return {
      id: Number(payload.id),
      username: String(payload.username),
      name: String(payload.name),
      email: String(payload.email || ""),
      phone: String(payload.phone || ""),
      role,
      idCabang: Number(payload.idCabang || 1),
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(
  req?: NextRequest
): Promise<SessionUser | null> {
  try {
    let token: string | undefined;
    if (req) {
      token = req.cookies.get("pos_gundam_token")?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("pos_gundam_token")?.value;
    }
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
