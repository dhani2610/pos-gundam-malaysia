import { NextRequest } from "next/server";
import { VoucherController } from "@/server/controllers/voucher.controller";

export async function POST(req: NextRequest) {
  return VoucherController.validateVoucher(req);
}
