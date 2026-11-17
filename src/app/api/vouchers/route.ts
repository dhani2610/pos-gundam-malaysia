import { NextRequest } from "next/server";
import { VoucherController } from "@/server/controllers/voucher.controller";

export async function GET(req: NextRequest) {
  return VoucherController.getVouchers(req);
}

export async function POST(req: NextRequest) {
  return VoucherController.createVoucher(req);
}

export async function PUT(req: NextRequest) {
  return VoucherController.updateVoucher(req);
}

export async function DELETE(req: NextRequest) {
  return VoucherController.deleteVoucher(req);
}
