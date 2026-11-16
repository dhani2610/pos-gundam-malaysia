import { NextRequest } from "next/server";
import { SettingsController } from "@/server/controllers/settings.controller";

export async function GET(req: NextRequest) {
  return SettingsController.getSettings(req);
}

export async function PUT(req: NextRequest) {
  return SettingsController.updateSettings(req);
}
