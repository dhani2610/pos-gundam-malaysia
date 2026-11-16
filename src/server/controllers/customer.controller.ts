import { NextRequest, NextResponse } from "next/server";
import { CustomerService } from "../services/customer.service";
import { getSessionUser } from "@/lib/auth";

export class CustomerController {
  static async getCustomers(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await CustomerService.getCustomers(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async saveCustomer(req: NextRequest) {
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
        await CustomerService.updateCustomer(Number(body.id), body, actor);
        return NextResponse.json({ success: true });
      } else {
        const customer = await CustomerService.createCustomer(body, actor);
        return NextResponse.json({ success: true, data: customer });
      }
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async deleteCustomer(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      await CustomerService.deleteCustomer(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
