import { NextRequest } from "next/server";
import { TransactionController } from "@/server/controllers/transaction.controller";

export async function GET(req: NextRequest) {
  return TransactionController.getTransactions(req);
}

export async function POST(req: NextRequest) {
  return TransactionController.createOrUpdateTransaction(req);
}

export async function PUT(req: NextRequest) {
  return TransactionController.createOrUpdateTransaction(req);
}

export async function DELETE(req: NextRequest) {
  return TransactionController.deleteTransaction(req);
}
