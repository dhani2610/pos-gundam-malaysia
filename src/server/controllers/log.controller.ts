import { NextRequest, NextResponse } from "next/server";
import { LogService } from "../services/log.service";

export class LogController {
  static async getLogs(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await LogService.list(idCabang);
    return NextResponse.json({ success: true, data });
  }
}
