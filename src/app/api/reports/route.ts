import { NextRequest } from "next/server";
import { ReportController } from "@/server/controllers/report.controller";

export async function GET(req: NextRequest) {
  return ReportController.getReports(req);
}
