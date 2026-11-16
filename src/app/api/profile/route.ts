import { NextRequest } from "next/server";
import { AuthController } from "@/server/controllers/auth.controller";

export async function GET(req: NextRequest) {
  return AuthController.me(req);
}

export async function PUT(req: NextRequest) {
  return AuthController.updateProfile(req);
}
