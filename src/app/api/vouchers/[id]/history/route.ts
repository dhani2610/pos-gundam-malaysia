import { NextRequest } from "next/server";
import { VoucherController } from "@/server/controllers/voucher.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return VoucherController.getVoucherHistory(req, Number(resolvedParams.id));
}
