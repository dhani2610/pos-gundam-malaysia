import { NextRequest, NextResponse } from "next/server";
import { MasterService } from "../services/master.service";
import { getSessionUser } from "@/lib/auth";

export class MasterController {
  // Branches
  static async getBranches() {
    const data = await MasterService.getBranches();
    return NextResponse.json({ success: true, data });
  }

  static async saveBranch(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const body = await req.json();
      if (body.id) {
        await MasterService.updateBranch(Number(body.id), body, actor);
      } else {
        await MasterService.createBranch(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  static async deleteBranch(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const id = Number(req.nextUrl.searchParams.get("id"));
      await MasterService.deleteBranch(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  // Users
  static async getUsers(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await MasterService.getUsers(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async saveUser(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const body = await req.json();
      if (body.id) {
        await MasterService.updateUser(Number(body.id), body, actor);
      } else {
        await MasterService.createUser(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  static async deleteUser(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const id = Number(req.nextUrl.searchParams.get("id"));
      await MasterService.deleteUser(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  // Categories
  static async getCategories(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await MasterService.getCategories(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async saveCategory(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const body = await req.json();
      if (body.id) {
        await MasterService.updateCategory(Number(body.id), body, actor);
      } else {
        await MasterService.createCategory(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  static async deleteCategory(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const id = Number(req.nextUrl.searchParams.get("id"));
      await MasterService.deleteCategory(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  // Sub Categories
  static async getSubCategories(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const categoryId = Number(req.nextUrl.searchParams.get("categoryId") || 0);
    const data = await MasterService.getSubCategories(idCabang, categoryId);
    return NextResponse.json({ success: true, data });
  }

  static async saveSubCategory(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const body = await req.json();
      if (body.id) {
        await MasterService.updateSubCategory(Number(body.id), body, actor);
      } else {
        await MasterService.createSubCategory(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  static async deleteSubCategory(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const id = Number(req.nextUrl.searchParams.get("id"));
      await MasterService.deleteSubCategory(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  // Brands
  static async getBrands(req: NextRequest) {
    const idCabang = Number(req.nextUrl.searchParams.get("idCabang") || 0);
    const data = await MasterService.getBrands(idCabang);
    return NextResponse.json({ success: true, data });
  }

  static async saveBrand(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const body = await req.json();
      if (body.id) {
        await MasterService.updateBrand(Number(body.id), body, actor);
      } else {
        await MasterService.createBrand(body, actor);
      }
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }

  static async deleteBrand(req: NextRequest) {
    try {
      const actor = await getSessionUser(req);
      if (!actor) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      const id = Number(req.nextUrl.searchParams.get("id"));
      await MasterService.deleteBrand(id, actor);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  }
}
