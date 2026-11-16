import { NextRequest } from "next/server";
import { ProductController } from "@/server/controllers/product.controller";

export async function GET(req: NextRequest) {
  return ProductController.getProducts(req);
}

export async function POST(req: NextRequest) {
  return ProductController.saveProduct(req);
}

export async function PUT(req: NextRequest) {
  return ProductController.saveProduct(req);
}

export async function DELETE(req: NextRequest) {
  return ProductController.deleteProduct(req);
}
