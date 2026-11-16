import { NextRequest } from "next/server";
import { MasterController } from "@/server/controllers/master.controller";

export async function GET(req: NextRequest) {
  return MasterController.getUsers(req);
}

export async function POST(req: NextRequest) {
  return MasterController.saveUser(req);
}

export async function PUT(req: NextRequest) {
  return MasterController.saveUser(req);
}

export async function DELETE(req: NextRequest) {
  return MasterController.deleteUser(req);
}
