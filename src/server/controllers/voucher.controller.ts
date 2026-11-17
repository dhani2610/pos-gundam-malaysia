import { NextRequest, NextResponse } from "next/server";
import { VoucherService } from "../services/voucher.service";
import { getSessionUser } from "@/lib/auth";

export class VoucherController {
  static async getVouchers(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
      const data = await VoucherService.listVouchers(idCabang);
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 500 }
      );
    }
  }

  static async createVoucher(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor || actor.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Only administrators can manage vouchers" },
          { status: 403 }
        );
      }
      const body = await req.json();
      const id = await VoucherService.createVoucher(body, actor);
      return NextResponse.json({ success: true, id }, { status: 201 });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async updateVoucher(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor || actor.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Only administrators can manage vouchers" },
          { status: 403 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      const body = await req.json();
      await VoucherService.updateVoucher(id, body, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async deleteVoucher(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor || actor.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Only administrators can delete vouchers" },
          { status: 403 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      await VoucherService.deleteVoucher(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async validateVoucher(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      const result = await VoucherService.validateAndCalculateVoucher(
        body.code,
        Number(body.idCabang || 0),
        Number(body.subtotal || 0)
      );
      return NextResponse.json({ success: true, data: result.voucher });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
