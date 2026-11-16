import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "../services/report.service";
import { getSessionUser } from "@/lib/auth";

export class ReportController {
  static async getDashboard(req: NextRequest) {
    const actor = await getSessionUser(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const startDate = req.nextUrl.searchParams.get("startDate") || undefined;
    const endDate = req.nextUrl.searchParams.get("endDate") || undefined;

    const data = await ReportService.getDashboardSummary({
      idCabang,
      actor,
      startDate,
      endDate,
    });
    return NextResponse.json({ success: true, data });
  }

  static async getReports(req: NextRequest) {
    const actor = await getSessionUser(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const startDate = req.nextUrl.searchParams.get("startDate") || undefined;
    const endDate = req.nextUrl.searchParams.get("endDate") || undefined;
    const cashierId = Number(req.nextUrl.searchParams.get("cashierId") || 0);

    const data = await ReportService.getReportData({
      idCabang,
      actor,
      startDate,
      endDate,
      cashierId: cashierId > 0 ? cashierId : undefined,
    });
    return NextResponse.json({ success: true, data });
  }
}
