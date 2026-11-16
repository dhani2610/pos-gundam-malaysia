import { pool } from "@/db";
import { ProductDto, StockInDto } from "../dtos/product.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class ProductService {
  static async getProducts(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT p.id, p.id_cabang as idCabang, p.product_code as productCode, p.name, p.image,
              p.category_id as categoryId, p.sub_category_id as subCategoryId, p.brand_id as brandId,
              p.stock, p.price, p.created_at as createdAt,
              c.name as categoryName, sc.name as subCategoryName, br.name as brandName, b.name as branchName
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
       LEFT JOIN brands br ON p.brand_id = br.id
       LEFT JOIN branches b ON p.id_cabang = b.id
       WHERE p.deleted_at IS NULL AND (? = 0 OR p.id_cabang = ?)
       ORDER BY p.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createProduct(dto: ProductDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO products (id_cabang, product_code, name, image, category_id, sub_category_id, brand_id, stock, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.idCabang,
        dto.productCode.trim(),
        dto.name.trim(),
        dto.image || "/images/gundam/rx78.svg",
        dto.categoryId,
        dto.subCategoryId,
        dto.brandId,
        Number(dto.stock || 0),
        Number(dto.price || 0),
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Products",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created product "${dto.name}" (Code: ${dto.productCode}, Price: RM ${Number(dto.price).toFixed(2)}, Initial Stock: ${dto.stock})`,
      metadata: { ...dto, id: res.insertId },
    });
    return res.insertId;
  }

  static async updateProduct(id: number, dto: ProductDto, actor: SessionUser) {
    const [existing]: any = await pool.query(
      `SELECT * FROM products WHERE id = ? LIMIT 1`,
      [id]
    );

    await pool.query(
      `UPDATE products
       SET id_cabang = ?, product_code = ?, name = ?, image = ?, category_id = ?, sub_category_id = ?, brand_id = ?, stock = ?, price = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        dto.idCabang,
        dto.productCode.trim(),
        dto.name.trim(),
        dto.image || "/images/gundam/rx78.svg",
        dto.categoryId,
        dto.subCategoryId,
        dto.brandId,
        Number(dto.stock || 0),
        Number(dto.price || 0),
        id,
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Products",
      action: "UPDATE",
      targetId: id,
      description: `Updated product "${dto.name}" (Code: ${dto.productCode}, Price: RM ${Number(dto.price).toFixed(2)}, Stock: ${dto.stock})`,
      metadata: {
        before: existing[0] || null,
        after: dto,
      },
    });
  }

  static async deleteProduct(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(`SELECT * FROM products WHERE id = ?`, [id]);
    await pool.query(
      `UPDATE products SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Products",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted product "${rows[0]?.name || id}" (Code: ${rows[0]?.product_code || ""})`,
    });
  }

  // ================= STOCK IN (PRODUCT MASUK) =================
  static async getStockIns(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT si.id, si.id_cabang as idCabang, si.reference_no as referenceNo, si.product_id as productId,
              si.qty, si.previous_stock as previousStock, si.new_stock as newStock,
              si.supplier, si.note, si.user_id as userId, si.created_at as createdAt,
              p.name as productName, p.product_code as productCode, p.image as productImage,
              u.name as userName, b.name as branchName
       FROM stock_ins si
       LEFT JOIN products p ON si.product_id = p.id
       LEFT JOIN users u ON si.user_id = u.id
       LEFT JOIN branches b ON si.id_cabang = b.id
       WHERE si.deleted_at IS NULL AND (? = 0 OR si.id_cabang = ?)
       ORDER BY si.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createStockIn(dto: StockInDto, actor: SessionUser) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [prodRows]: any = await conn.query(
        `SELECT * FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
        [dto.productId]
      );
      const product = prodRows[0];
      if (!product) {
        throw new Error("Selected product not found");
      }

      const qty = Number(dto.qty);
      if (qty <= 0) {
        throw new Error("Stock-in quantity must be greater than 0");
      }

      const previousStock = Number(product.stock || 0);
      const newStock = previousStock + qty;
      const refNo = `STK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const [res]: any = await conn.query(
        `INSERT INTO stock_ins (id_cabang, reference_no, product_id, qty, previous_stock, new_stock, supplier, note, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.idCabang || product.id_cabang,
          refNo,
          dto.productId,
          qty,
          previousStock,
          newStock,
          dto.supplier || "Direct Restock",
          dto.note || "",
          actor.id,
        ]
      );

      await conn.query(
        `UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?`,
        [newStock, dto.productId]
      );

      await conn.commit();

      await LogService.record({
        idCabang: dto.idCabang || product.id_cabang,
        user: actor,
        module: "Stock In",
        action: "STOCK_IN",
        targetId: res.insertId,
        description: `Stock In +${qty} units for "${product.name}" (Stock: ${previousStock} -> ${newStock})`,
        metadata: {
          referenceNo: refNo,
          productId: dto.productId,
          productName: product.name,
          qty,
          previousStock,
          newStock,
        },
      });

      return res.insertId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteStockIn(id: number, actor: SessionUser) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows]: any = await conn.query(
        `SELECT * FROM stock_ins WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
        [id]
      );
      const stockIn = rows[0];
      if (!stockIn) throw new Error("Stock-in record not found");

      // Deduct the stock back when soft-deleting a Stock In entry
      await conn.query(
        `UPDATE products SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE id = ?`,
        [stockIn.qty, stockIn.product_id]
      );

      await conn.query(
        `UPDATE stock_ins SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
        [actor.id, id]
      );

      await conn.commit();

      await LogService.record({
        idCabang: stockIn.id_cabang,
        user: actor,
        module: "Stock In",
        action: "SOFT_DELETE",
        targetId: id,
        description: `Soft-deleted Stock In ${stockIn.reference_no} (-${stockIn.qty} units reverted)`,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
