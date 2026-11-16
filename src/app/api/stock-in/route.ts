import { NextRequest } from "next/server";
import { ProductController } from "@/server/controllers/product.controller";

export async function GET(req: NextRequest) {
  return ProductController.getStockIns(req);
}

export async function POST(req: NextRequest) {
  return ProductController.createStockIn(req);
}

export async function DELETE(req: NextRequest) {
  return ProductController.deleteStockIn(req);
}
