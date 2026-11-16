import { NextRequest } from "next/server";
import { TrashController } from "@/server/controllers/trash.controller";

export async function GET(req: NextRequest) {
  return TrashController.getTrash(req);
}

export async function POST(req: NextRequest) {
  return TrashController.restore(req);
}

export async function DELETE(req: NextRequest) {
  return TrashController.permanentDelete(req);
}
