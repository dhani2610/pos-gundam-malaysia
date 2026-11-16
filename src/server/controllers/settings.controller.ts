import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "../services/settings.service";
import { getSessionUser } from "@/lib/auth";

export class SettingsController {
  static async getSettings(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 1);
    const data = await SettingsService.getSettings(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async updateSettings(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      const data = await SettingsService.updateSettings(body, actor);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
