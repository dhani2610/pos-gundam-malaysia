import { NextRequest } from "next/server";
import { MasterController } from "@/server/controllers/master.controller";

export async function GET(req: NextRequest) {
  return MasterController.getCategories(req);
}

export async function POST(req: NextRequest) {
  return MasterController.saveCategory(req);
}

export async function PUT(req: NextRequest) {
  return MasterController.saveCategory(req);
}

export async function DELETE(req: NextRequest) {
  return MasterController.deleteCategory(req);
}
