import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "../services/product.service";
import { getSessionUser } from "@/lib/auth";

export class ProductController {
  static async getProducts(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await ProductService.getProducts(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async saveProduct(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      if (body.id) {
        if (actor.role === "admin_stok") {
          return NextResponse.json(
            {
              success: false,
              message: "Admin Stok is not permitted to edit existing products",
            },
            { status: 403 }
          );
        }
        await ProductService.updateProduct(Number(body.id), body, actor);
      } else {
        await ProductService.createProduct(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async deleteProduct(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      if (actor.role === "admin_stok") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin Stok is not permitted to delete products",
          },
          { status: 403 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      await ProductService.deleteProduct(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  // Stock In
  static async getStockIns(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await ProductService.getStockIns(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async createStockIn(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      await ProductService.createStockIn(body, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async deleteStockIn(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      if (actor.role === "admin_stok") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin Stok is not permitted to delete products",
          },
          { status: 403 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      await ProductService.deleteStockIn(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
