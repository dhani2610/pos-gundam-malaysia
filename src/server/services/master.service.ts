import { pool } from "@/db";
import bcrypt from "bcryptjs";
import {
  BranchDto,
  UserDto,
  CategoryDto,
  SubCategoryDto,
  BrandDto,
} from "../dtos/master.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class MasterService {
  // ================= BRANCHES =================
  static async getBranches() {
    const [rows] = await pool.query(
      `SELECT id, id_cabang as idCabang, code, name, address, phone, is_main as isMain, created_at as createdAt
       FROM branches
       WHERE deleted_at IS NULL
       ORDER BY is_main DESC, id ASC`
    );
    return rows;
  }

  static async createBranch(dto: BranchDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO branches (id_cabang, code, name, address, phone, is_main) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        actor.idCabang || 1,
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.address || "",
        dto.phone || "",
        dto.isMain ? 1 : 0,
      ]
    );
    const branchId = res.insertId;
    await pool.query(`UPDATE branches SET id_cabang = ? WHERE id = ?`, [
      branchId,
      branchId,
    ]);

    // Ensure default website settings exist for this new branch
    await pool.query(
      `INSERT INTO website_settings (id_cabang, site_name, logo_url, address, phone, bank_name, bank_account_number, bank_account_holder, receipt_footer)
       VALUES (?, ?, '/images/gundam/logo.svg', ?, ?, 'Maybank', '514012349988', 'GUNDAM BASE MALAYSIA SDN BHD', 'Thank you for shopping at Gundam Base!')`,
      [branchId, dto.name.trim().toUpperCase(), dto.address || "", dto.phone || ""]
    );

    await LogService.record({
      idCabang: branchId,
      user: actor,
      module: "Branches",
      action: "CREATE",
      targetId: branchId,
      description: `Created branch "${dto.name}" (${dto.code})`,
      metadata: { ...dto, id: branchId },
    });
    return branchId;
  }

  static async updateBranch(id: number, dto: BranchDto, actor: SessionUser) {
    await pool.query(
      `UPDATE branches SET code = ?, name = ?, address = ?, phone = ?, is_main = ?, updated_at = NOW() WHERE id = ?`,
      [
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.address || "",
        dto.phone || "",
        dto.isMain ? 1 : 0,
        id,
      ]
    );
    await LogService.record({
      idCabang: id,
      user: actor,
      module: "Branches",
      action: "UPDATE",
      targetId: id,
      description: `Updated branch "${dto.name}" (${dto.code})`,
      metadata: { id, ...dto },
    });
  }

  static async deleteBranch(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(`SELECT * FROM branches WHERE id = ?`, [id]);
    if (rows[0]?.is_main) {
      throw new Error("Cannot delete the main HQ branch");
    }
    await pool.query(
      `UPDATE branches SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: actor.idCabang,
      user: actor,
      module: "Branches",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted branch "${rows[0]?.name || id}"`,
    });
  }

  // ================= USERS =================
  static async getUsers(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT u.id, u.id_cabang as idCabang, u.username, u.name, u.email, u.phone, u.role, u.created_at as createdAt, b.name as branchName
       FROM users u
       LEFT JOIN branches b ON u.id_cabang = b.id
       WHERE u.deleted_at IS NULL AND (? = 0 OR u.id_cabang = ?)
       ORDER BY u.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createUser(dto: UserDto, actor: SessionUser) {
    const [dup]: any = await pool.query(
      `SELECT id FROM users WHERE username = ? AND deleted_at IS NULL LIMIT 1`,
      [dto.username.trim()]
    );
    if (dup.length > 0) {
      throw new Error(`Username "${dto.username}" is already in use`);
    }

    const passwordHash = await bcrypt.hash(dto.password || "123456", 10);
    const [res]: any = await pool.query(
      `INSERT INTO users (id_cabang, username, password, name, email, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.idCabang,
        dto.username.trim(),
        passwordHash,
        dto.name.trim(),
        dto.email.trim(),
        dto.phone.trim(),
        dto.role,
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Users",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created user "${dto.name}" (@${dto.username}) with role ${dto.role.toUpperCase()}`,
      metadata: { username: dto.username, role: dto.role, email: dto.email },
    });
    return res.insertId;
  }

  static async updateUser(id: number, dto: UserDto, actor: SessionUser) {
    const [dup]: any = await pool.query(
      `SELECT id FROM users WHERE username = ? AND id != ? AND deleted_at IS NULL LIMIT 1`,
      [dto.username.trim(), id]
    );
    if (dup.length > 0) {
      throw new Error(`Username "${dto.username}" is already in use`);
    }

    if (dto.password && dto.password.trim().length > 0) {
      const passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      await pool.query(
        `UPDATE users SET id_cabang = ?, username = ?, password = ?, name = ?, email = ?, phone = ?, role = ?, updated_at = NOW() WHERE id = ?`,
        [
          dto.idCabang,
          dto.username.trim(),
          passwordHash,
          dto.name.trim(),
          dto.email.trim(),
          dto.phone.trim(),
          dto.role,
          id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE users SET id_cabang = ?, username = ?, name = ?, email = ?, phone = ?, role = ?, updated_at = NOW() WHERE id = ?`,
        [
          dto.idCabang,
          dto.username.trim(),
          dto.name.trim(),
          dto.email.trim(),
          dto.phone.trim(),
          dto.role,
          id,
        ]
      );
    }

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Users",
      action: "UPDATE",
      targetId: id,
      description: `Updated user "${dto.name}" (@${dto.username})`,
      metadata: { id, username: dto.username, role: dto.role },
    });
  }

  static async deleteUser(id: number, actor: SessionUser) {
    if (id === actor.id) {
      throw new Error("You cannot delete your own active account");
    }
    const [rows]: any = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
    await pool.query(
      `UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Users",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted user "${rows[0]?.name || id}" (@${rows[0]?.username})`,
    });
  }

  // ================= CATEGORIES =================
  static async getCategories(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT c.id, c.id_cabang as idCabang, c.code, c.name, c.description, c.created_at as createdAt, b.name as branchName,
              (SELECT COUNT(*) FROM sub_categories sc WHERE sc.category_id = c.id AND sc.deleted_at IS NULL) as subCategoryCount,
              (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as productCount
       FROM categories c
       LEFT JOIN branches b ON c.id_cabang = b.id
       WHERE c.deleted_at IS NULL AND (? = 0 OR c.id_cabang = ?)
       ORDER BY c.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createCategory(dto: CategoryDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO categories (id_cabang, code, name, description) VALUES (?, ?, ?, ?)`,
      [
        dto.idCabang,
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.description || "",
      ]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Categories",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created category "${dto.name}" (${dto.code})`,
      metadata: { ...dto },
    });
    return res.insertId;
  }

  static async updateCategory(id: number, dto: CategoryDto, actor: SessionUser) {
    await pool.query(
      `UPDATE categories SET id_cabang = ?, code = ?, name = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [
        dto.idCabang,
        dto.code.trim().toUpperCase(),
        dto.name.trim(),
        dto.description || "",
        id,
      ]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Categories",
      action: "UPDATE",
      targetId: id,
      description: `Updated category "${dto.name}" (${dto.code})`,
      metadata: { id, ...dto },
    });
  }

  static async deleteCategory(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(`SELECT * FROM categories WHERE id = ?`, [id]);
    await pool.query(
      `UPDATE categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Categories",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted category "${rows[0]?.name || id}"`,
    });
  }

  // ================= SUB CATEGORIES =================
  static async getSubCategories(idCabang: number, categoryId?: number) {
    let sqlQuery = `
      SELECT sc.id, sc.id_cabang as idCabang, sc.category_id as categoryId, sc.name, sc.description, sc.created_at as createdAt,
             c.name as categoryName, b.name as branchName,
             (SELECT COUNT(*) FROM products p WHERE p.sub_category_id = sc.id AND p.deleted_at IS NULL) as productCount
      FROM sub_categories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      LEFT JOIN branches b ON sc.id_cabang = b.id
      WHERE sc.deleted_at IS NULL AND (? = 0 OR sc.id_cabang = ?)
    `;
    const params: any[] = [idCabang, idCabang];
    if (categoryId && categoryId > 0) {
      sqlQuery += ` AND sc.category_id = ?`;
      params.push(categoryId);
    }
    sqlQuery += ` ORDER BY sc.id DESC`;
    const [rows] = await pool.query(sqlQuery, params);
    return rows;
  }

  static async createSubCategory(dto: SubCategoryDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO sub_categories (id_cabang, category_id, name, description) VALUES (?, ?, ?, ?)`,
      [dto.idCabang, dto.categoryId, dto.name.trim(), dto.description || ""]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Sub Categories",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created sub-category "${dto.name}"`,
      metadata: { ...dto },
    });
    return res.insertId;
  }

  static async updateSubCategory(
    id: number,
    dto: SubCategoryDto,
    actor: SessionUser
  ) {
    await pool.query(
      `UPDATE sub_categories SET id_cabang = ?, category_id = ?, name = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [dto.idCabang, dto.categoryId, dto.name.trim(), dto.description || "", id]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Sub Categories",
      action: "UPDATE",
      targetId: id,
      description: `Updated sub-category "${dto.name}"`,
      metadata: { id, ...dto },
    });
  }

  static async deleteSubCategory(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(
      `SELECT * FROM sub_categories WHERE id = ?`,
      [id]
    );
    await pool.query(
      `UPDATE sub_categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Sub Categories",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted sub-category "${rows[0]?.name || id}"`,
    });
  }

  // ================= BRANDS =================
  static async getBrands(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT br.id, br.id_cabang as idCabang, br.name, br.description, br.created_at as createdAt, b.name as branchName,
              (SELECT COUNT(*) FROM products p WHERE p.brand_id = br.id AND p.deleted_at IS NULL) as productCount
       FROM brands br
       LEFT JOIN branches b ON br.id_cabang = b.id
       WHERE br.deleted_at IS NULL AND (? = 0 OR br.id_cabang = ?)
       ORDER BY br.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createBrand(dto: BrandDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO brands (id_cabang, name, description) VALUES (?, ?, ?)`,
      [dto.idCabang, dto.name.trim(), dto.description || ""]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Brands",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created brand "${dto.name}"`,
      metadata: { ...dto },
    });
    return res.insertId;
  }

  static async updateBrand(id: number, dto: BrandDto, actor: SessionUser) {
    await pool.query(
      `UPDATE brands SET id_cabang = ?, name = ?, description = ?, updated_at = NOW() WHERE id = ?`,
      [
        dto.idCabang,
        dto.name.trim(),
        dto.description || "",
        id,
      ]
    );
    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Brands",
      action: "UPDATE",
      targetId: id,
      description: `Updated brand "${dto.name}"`,
      metadata: { id, ...dto },
    });
  }

  static async deleteBrand(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(`SELECT * FROM brands WHERE id = ?`, [id]);
    await pool.query(
      `UPDATE brands SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Brands",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted brand "${rows[0]?.name || id}"`,
    });
  }
}
