import { NextRequest } from "next/server";
import { MasterController } from "@/server/controllers/master.controller";

export async function GET() {
  return MasterController.getBranches();
}

export async function POST(req: NextRequest) {
  return MasterController.saveBranch(req);
}

export async function PUT(req: NextRequest) {
  return MasterController.saveBranch(req);
}

export async function DELETE(req: NextRequest) {
  return MasterController.deleteBranch(req);
}
