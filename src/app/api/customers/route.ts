import { NextRequest } from "next/server";
import { CustomerController } from "@/server/controllers/customer.controller";

export async function GET(req: NextRequest) {
  return CustomerController.getCustomers(req);
}

export async function POST(req: NextRequest) {
  return CustomerController.saveCustomer(req);
}

export async function PUT(req: NextRequest) {
  return CustomerController.saveCustomer(req);
}

export async function DELETE(req: NextRequest) {
  return CustomerController.deleteCustomer(req);
}
