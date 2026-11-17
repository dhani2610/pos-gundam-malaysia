import { pool } from "@/db";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

const ALLOWED_MODULES: Record<
  string,
  { table: string; titleCol: string; codeCol: string; label: string }
> = {
  products: {
    table: "products",
    titleCol: "name",
    codeCol: "product_code",
    label: "Products",
  },
  transactions: {
    table: "transactions",
    titleCol: "customer_name",
    codeCol: "invoice_no",
    label: "Transactions",
  },
  customers: {
    table: "customers",
    titleCol: "name",
    codeCol: "phone",
    label: "Customers",
  },
  categories: {
    table: "categories",
    titleCol: "name",
    codeCol: "code",
    label: "Categories",
  },
  sub_categories: {
    table: "sub_categories",
    titleCol: "name",
    codeCol: "id",
    label: "Sub Categories",
  },
  brands: {
    table: "brands",
    titleCol: "name",
    codeCol: "id",
    label: "Brands",
  },
  stock_ins: {
    table: "stock_ins",
    titleCol: "supplier",
    codeCol: "reference_no",
    label: "Stock In",
  },
  users: {
    table: "users",
    titleCol: "name",
    codeCol: "username",
    label: "Users",
  },
  branches: {
    table: "branches",
    titleCol: "name",
    codeCol: "code",
    label: "Branches",
  },
  vouchers: {
    table: "vouchers",
    titleCol: "name",
    codeCol: "code",
    label: "Vouchers",
  },
};

export class TrashService {
  static async listTrash(idCabang: number) {
    const allDeleted: any[] = [];

    for (const [key, cfg] of Object.entries(ALLOWED_MODULES)) {
      const [rows]: any = await pool.query(
        `SELECT t.id, t.id_cabang as idCabang, t.${cfg.titleCol} as title, t.${cfg.codeCol} as code,
                t.deleted_at as deletedAt, t.deleted_by as deletedBy,
                u.name as deletedByName, u.username as deletedByUsername,
                b.name as branchName
         FROM ${cfg.table} t
         LEFT JOIN users u ON t.deleted_by = u.id
         LEFT JOIN branches b ON t.id_cabang = b.id
         WHERE t.deleted_at IS NOT NULL AND (? = 0 OR t.id_cabang = ?)
         ORDER BY t.deleted_at DESC`,
        [idCabang, idCabang]
      );

      for (const r of rows) {
        allDeleted.push({
          ...r,
          moduleKey: key,
          moduleLabel: cfg.label,
        });
      }
    }

    return allDeleted.sort(
      (a, b) =>
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );
  }

  static async restoreItem(
    moduleKey: string,
    id: number,
    actor: SessionUser
  ) {
    const cfg = ALLOWED_MODULES[moduleKey];
    if (!cfg) {
      throw new Error("Invalid module key for restoration");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows]: any = await conn.query(
        `SELECT * FROM ${cfg.table} WHERE id = ? AND deleted_at IS NOT NULL FOR UPDATE`,
        [id]
      );
      const record = rows[0];
      if (!record) {
        throw new Error("Deleted record not found");
      }

      if (moduleKey === "transactions") {
        const [items]: any = await conn.query(
          `SELECT * FROM transaction_items WHERE transaction_id = ? AND deleted_at IS NULL`,
          [id]
        );
        for (const item of items) {
          await conn.query(
            `UPDATE products SET stock = GREATEST(0, stock - ?), updated_at = NOW() WHERE id = ?`,
            [item.qty, item.product_id]
          );
        }
      } else if (moduleKey === "stock_ins") {
        const [items]: any = await conn.query(
          `SELECT * FROM stock_in_items WHERE stock_in_id = ?`,
          [id]
        );
        if (items.length > 0) {
          for (const item of items) {
            await conn.query(
              `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`,
              [item.qty, item.product_id]
            );
          }
          await conn.query(
            `UPDATE stock_in_items SET deleted_at = NULL, deleted_by = NULL WHERE stock_in_id = ?`,
            [id]
          );
        } else if (record.product_id && record.qty > 0) {
          await conn.query(
            `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`,
            [record.qty, record.product_id]
          );
        }
      }

      await conn.query(
        `UPDATE ${cfg.table} SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`,
        [id]
      );

      await conn.commit();

      await LogService.record({
        idCabang: record.id_cabang || actor.idCabang,
        user: actor,
        module: cfg.label,
        action: "RESTORE",
        targetId: id,
        description: `Restored ${cfg.label} record "${record[cfg.titleCol]} (${record[cfg.codeCol]})" from Trash`,
        metadata: { moduleKey, id },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async permanentDeleteItem(
    moduleKey: string,
    id: number,
    actor: SessionUser
  ) {
    const cfg = ALLOWED_MODULES[moduleKey];
    if (!cfg) {
      throw new Error("Invalid module key for deletion");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows]: any = await conn.query(
        `SELECT * FROM ${cfg.table} WHERE id = ? AND deleted_at IS NOT NULL FOR UPDATE`,
        [id]
      );
      const record = rows[0];
      if (!record) {
        throw new Error("Trash record not found");
      }

      if (moduleKey === "transactions") {
        await conn.query(
          `DELETE FROM transaction_items WHERE transaction_id = ?`,
          [id]
        );
      } else if (moduleKey === "stock_ins") {
        await conn.query(
          `DELETE FROM stock_in_items WHERE stock_in_id = ?`,
          [id]
        );
      }

      await conn.query(`DELETE FROM ${cfg.table} WHERE id = ?`, [id]);

      await conn.commit();

      await LogService.record({
        idCabang: record.id_cabang || actor.idCabang,
        user: actor,
        module: cfg.label,
        action: "PERMANENT_DELETE",
        targetId: id,
        description: `Permanently deleted ${cfg.label} record "${record[cfg.titleCol]} (${record[cfg.codeCol]})" from Trash`,
        metadata: { moduleKey, id, title: record[cfg.titleCol] },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
