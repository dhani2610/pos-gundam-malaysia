import { NextRequest } from "next/server";
import { LogController } from "@/server/controllers/log.controller";

export async function GET(req: NextRequest) {
  return LogController.getLogs(req);
}
