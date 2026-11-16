import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth.service";
import { getSessionUser } from "@/lib/auth";
import { LogService } from "../services/log.service";

export class AuthController {
  static async login(req: NextRequest) {
    try {
      const body = await req.json();
      const result = await AuthService.login(body);

      const response = NextResponse.json({
        success: true,
        user: result.user,
        branchName: result.branchName,
      });

      response.cookies.set("pos_gundam_token", result.token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });

      return response;
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message || "Authentication failed" },
        { status: 401 }
      );
    }
  }

  static async logout(req: NextRequest) {
    const user = await getSessionUser(req);
    if (user) {
      await LogService.record({
        idCabang: user.idCabang,
        user,
        module: "Authentication",
        action: "LOGOUT",
        targetId: user.id,
        description: `User ${user.name} (@${user.username}) logged out`,
      });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.delete("pos_gundam_token");
    return response;
  }

  static async me(req: NextRequest) {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const profile = await AuthService.getProfile(session.id);
    return NextResponse.json({
      success: true,
      user: profile || session,
    });
  }

  static async updateProfile(req: NextRequest) {
    try {
      const session = await getSessionUser(req);
      if (!session) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      const result = await AuthService.updateProfile(session, body);

      const response = NextResponse.json({
        success: true,
        user: result.user,
      });
      response.cookies.set("pos_gundam_token", result.token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      return response;
    } catch (error: any) {
      return NextResponse.json(
        { success: false, message: error.message || "Failed to update profile" },
        { status: 400 }
      );
    }
  }
}
