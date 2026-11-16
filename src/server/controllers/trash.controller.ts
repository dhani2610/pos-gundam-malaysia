import { NextRequest, NextResponse } from "next/server";
import { TrashService } from "../services/trash.service";
import { getSessionUser } from "@/lib/auth";

export class TrashController {
  static async getTrash(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await TrashService.listTrash(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async restore(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      await TrashService.restoreItem(body.moduleKey, Number(body.id), actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async permanentDelete(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      await TrashService.permanentDeleteItem(
        body.moduleKey,
        Number(body.id),
        actor
      );
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
