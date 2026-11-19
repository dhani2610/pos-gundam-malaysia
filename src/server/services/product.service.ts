import { pool } from "@/db";
import { ProductDto, StockInDto } from "../dtos/product.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class ProductService {
  static async getProducts(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT p.id, p.id_cabang as idCabang, p.product_code as productCode, p.name, p.image,
              p.category_id as categoryId, p.sub_category_id as subCategoryId, p.brand_id as brandId,
              p.stock, p.cost_price as costPrice, p.price, p.created_at as createdAt,
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
      `INSERT INTO products (id_cabang, product_code, name, image, category_id, sub_category_id, brand_id, stock, cost_price, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.idCabang,
        dto.productCode.trim(),
        dto.name.trim(),
        dto.image || "/images/gundam/rx78.svg",
        dto.categoryId,
        dto.subCategoryId,
        dto.brandId,
        Number(dto.stock || 0),
        Number(dto.costPrice || 0),
        Number(dto.price || 0),
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Products",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created product "${dto.name}" (Code: ${dto.productCode}, Cost: RM ${Number(dto.costPrice || 0).toFixed(2)}, Price: RM ${Number(dto.price).toFixed(2)}, Initial Stock: ${dto.stock})`,
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
       SET id_cabang = ?, product_code = ?, name = ?, image = ?, category_id = ?, sub_category_id = ?, brand_id = ?, stock = ?, cost_price = ?, price = ?, updated_at = NOW()
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
        Number(dto.costPrice || 0),
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
      description: `Updated product "${dto.name}" (Code: ${dto.productCode}, Cost: RM ${Number(dto.costPrice || 0).toFixed(2)}, Price: RM ${Number(dto.price).toFixed(2)}, Stock: ${dto.stock})`,
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
    const [rows]: any = await pool.query(
      `SELECT si.id, si.id_cabang as idCabang, si.reference_no as referenceNo,
              si.invoice_no as invoiceNo, si.product_id as productId,
              si.qty, si.total_amount as totalAmount, si.total_items as totalItems,
              si.previous_stock as previousStock, si.new_stock as newStock,
              si.supplier, si.invoice_file as invoiceFile, si.invoice_file_name as invoiceFileName,
              si.note, si.user_id as userId, si.created_at as createdAt,
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

    if (rows.length > 0) {
      const ids = rows.map((r: any) => r.id);
      const [itemRows]: any = await pool.query(
        `SELECT sii.id, sii.stock_in_id as stockInId, sii.product_id as productId,
                sii.qty, sii.cost_price as costPrice, sii.subtotal,
                sii.previous_stock as previousStock, sii.new_stock as newStock,
                p.name as productName, p.product_code as productCode, p.image as productImage
         FROM stock_in_items sii
         JOIN products p ON sii.product_id = p.id
         WHERE sii.stock_in_id IN (?) AND sii.deleted_at IS NULL
         ORDER BY sii.id ASC`,
        [ids]
      );

      const itemsByStockInId: Record<number, any[]> = {};
      for (const item of itemRows) {
        if (!itemsByStockInId[item.stockInId]) itemsByStockInId[item.stockInId] = [];
        itemsByStockInId[item.stockInId].push(item);
      }

      for (const row of rows) {
        const items = itemsByStockInId[row.id] || [];
        if (items.length > 0) {
          row.items = items;
          row.totalItems = items.length;
          row.qty = items.reduce((sum: number, it: any) => sum + Number(it.qty || 0), 0);
          row.totalAmount = items.reduce((sum: number, it: any) => sum + Number(it.subtotal || 0), 0);
        } else if (row.productId && row.productName) {
          // Backward compatibility for legacy single-item stock-in
          row.items = [
            {
              id: 0,
              stockInId: row.id,
              productId: row.productId,
              productCode: row.productCode,
              productName: row.productName,
              productImage: row.productImage,
              qty: row.qty,
              costPrice: 0,
              subtotal: 0,
              previousStock: row.previousStock,
              newStock: row.newStock,
            },
          ];
          row.totalItems = 1;
        } else {
          row.items = [];
        }
      }
    }

    return rows;
  }

  static async createStockIn(dto: StockInDto, actor: SessionUser) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Normalize items: can be dto.items array OR single product
      let itemsToProcess = dto.items && dto.items.length > 0 ? dto.items : [];
      if (itemsToProcess.length === 0 && dto.productId && dto.qty) {
        itemsToProcess.push({
          productId: dto.productId,
          qty: dto.qty,
          costPrice: dto.costPrice || 0,
        });
      }

      if (itemsToProcess.length === 0) {
        throw new Error("Please add at least one product item to stock in");
      }

      // Filter and validate items
      const validItems: any[] = [];
      let totalQty = 0;
      let totalAmount = 0;

      for (const item of itemsToProcess) {
        const pid = Number(item.productId);
        const qty = Number(item.qty);
        const costPrice = Number(item.costPrice || 0);

        if (!pid || isNaN(pid)) continue;
        if (qty <= 0 || isNaN(qty)) {
          throw new Error("Quantity for each product item must be greater than 0");
        }

        const [prodRows]: any = await conn.query(
          `SELECT id, id_cabang, name, product_code, stock, price FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
          [pid]
        );
        const product = prodRows[0];
        if (!product) {
          throw new Error(`Product with ID ${pid} not found or has been deleted`);
        }

        const previousStock = Number(product.stock || 0);
        const newStock = previousStock + qty;
        const subtotal = Math.round(qty * costPrice * 100) / 100;

        totalQty += qty;
        totalAmount += subtotal;

        validItems.push({
          product,
          productId: pid,
          qty,
          costPrice,
          subtotal,
          previousStock,
          newStock,
        });
      }

      if (validItems.length === 0) {
        throw new Error("No valid product items provided");
      }

      const branchId = dto.idCabang || validItems[0].product.id_cabang;
      const refNo =
        dto.referenceNo?.trim() ||
        `STK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const firstItem = validItems[0];

      // Insert master stock_ins row
      const [res]: any = await conn.query(
        `INSERT INTO stock_ins (
           id_cabang, reference_no, invoice_no, product_id, qty, total_amount,
           previous_stock, new_stock, supplier, invoice_file, invoice_file_name,
           total_items, note, user_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          branchId,
          refNo,
          dto.invoiceNo?.trim() || null,
          validItems.length === 1 ? firstItem.productId : null,
          totalQty,
          totalAmount,
          validItems.length === 1 ? firstItem.previousStock : 0,
          validItems.length === 1 ? firstItem.newStock : 0,
          dto.supplier?.trim() || "Supplier",
          dto.invoiceFile || null,
          dto.invoiceFileName || null,
          validItems.length,
          dto.note?.trim() || "",
          actor.id,
        ]
      );

      const stockInId = res.insertId;

      // Insert into stock_in_items and update products stock
      for (const it of validItems) {
        await conn.query(
          `INSERT INTO stock_in_items (
             stock_in_id, product_id, qty, cost_price, subtotal, previous_stock, new_stock
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            stockInId,
            it.productId,
            it.qty,
            it.costPrice,
            it.subtotal,
            it.previousStock,
            it.newStock,
          ]
        );

        await conn.query(
          `UPDATE products SET stock = ?, cost_price = CASE WHEN ? > 0 THEN ? ELSE cost_price END, updated_at = NOW() WHERE id = ?`,
          [it.newStock, it.costPrice, it.costPrice, it.productId]
        );
      }

      await conn.commit();

      const itemNames = validItems
        .map((v) => `${v.product.name} (+${v.qty})`)
        .join(", ");
      await LogService.record({
        idCabang: branchId,
        user: actor,
        module: "Stock In",
        action: "STOCK_IN",
        targetId: stockInId,
        description: `Stock In ${refNo} from "${dto.supplier || "Supplier"}" (${validItems.length} items, +${totalQty} pcs total): ${itemNames}`,
        metadata: {
          stockInId,
          referenceNo: refNo,
          invoiceNo: dto.invoiceNo,
          supplier: dto.supplier,
          invoiceFile: dto.invoiceFile,
          totalItems: validItems.length,
          totalQty,
          totalAmount,
        },
      });

      return stockInId;
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

      // Check for stock_in_items
      const [items]: any = await conn.query(
        `SELECT * FROM stock_in_items WHERE stock_in_id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (items.length > 0) {
        for (const it of items) {
          await conn.query(
            `UPDATE products SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE id = ?`,
            [it.qty, it.product_id]
          );
        }
        await conn.query(
          `UPDATE stock_in_items SET deleted_at = NOW(), deleted_by = ? WHERE stock_in_id = ?`,
          [actor.id, id]
        );
      } else if (stockIn.product_id && stockIn.qty > 0) {
        // Legacy single item
        await conn.query(
          `UPDATE products SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE id = ?`,
          [stockIn.qty, stockIn.product_id]
        );
      }

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
        description: `Soft-deleted Stock In ${stockIn.reference_no} (-${stockIn.qty} total units reverted)`,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
