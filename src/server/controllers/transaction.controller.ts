import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "../services/transaction.service";
import { getSessionUser } from "@/lib/auth";

export class TransactionController {
  static async getTransactions(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const singleId = req.nextUrl.searchParams.get("id");
      if (singleId) {
        const data = await TransactionService.getTransactionById(Number(singleId));
        return NextResponse.json({ success: true, data });
      }

      const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
      const startDate = req.nextUrl.searchParams.get("startDate") || undefined;
      const endDate = req.nextUrl.searchParams.get("endDate") || undefined;

      const data = await TransactionService.listTransactions({
        idCabang,
        actor,
        startDate,
        endDate,
      });
      return NextResponse.json({ success: true, data });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async createOrUpdateTransaction(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const body = await req.json();
      let transaction;
      if (body.id) {
        transaction = await TransactionService.updateTransaction(body, actor);
      } else {
        transaction = await TransactionService.createTransaction(body, actor);
      }
      return NextResponse.json({ success: true, data: transaction });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }

  static async deleteTransaction(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      const id = Number(req.nextUrl.searchParams.get("id"));
      await TransactionService.deleteTransaction(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: 400 }
      );
    }
  }
}
