import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/server/services/product.service";
import { MasterService } from "@/server/services/master.service";
import { CustomerService } from "@/server/services/customer.service";
import { SettingsService } from "@/server/services/settings.service";

export async function GET(req: NextRequest) {
  try {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 1);
    const [products, categories, subCategories, brands, customers, settings] =
      await Promise.all([
        ProductService.getProducts(idCabang),
        MasterService.getCategories(idCabang),
        MasterService.getSubCategories(idCabang),
        MasterService.getBrands(idCabang),
        CustomerService.getCustomers(idCabang),
        SettingsService.getSettings(idCabang),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories,
        subCategories,
        brands,
        customers,
        settings,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
