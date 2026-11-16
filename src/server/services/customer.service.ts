import { pool } from "@/db";
import { CustomerDto } from "../dtos/master.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class CustomerService {
  static async getCustomers(idCabang: number) {
    const [rows] = await pool.query(
      `SELECT c.id, c.id_cabang as idCabang, c.name, c.phone, c.address, c.created_at as createdAt,
              b.name as branchName,
              (SELECT COUNT(*) FROM transactions t WHERE t.customer_id = c.id AND t.deleted_at IS NULL) as totalTransactions,
              (SELECT COALESCE(SUM(t.net_total), 0) FROM transactions t WHERE t.customer_id = c.id AND t.deleted_at IS NULL) as totalSpent
       FROM customers c
       LEFT JOIN branches b ON c.id_cabang = b.id
       WHERE c.deleted_at IS NULL AND (? = 0 OR c.id_cabang = ?)
       ORDER BY c.id DESC`,
      [idCabang, idCabang]
    );
    return rows;
  }

  static async createCustomer(dto: CustomerDto, actor: SessionUser) {
    const [res]: any = await pool.query(
      `INSERT INTO customers (id_cabang, name, phone, address) VALUES (?, ?, ?, ?)`,
      [
        dto.idCabang || actor.idCabang,
        dto.name.trim(),
        dto.phone.trim(),
        dto.address?.trim() || "",
      ]
    );

    const newCustomer = {
      id: res.insertId,
      idCabang: dto.idCabang || actor.idCabang,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      address: dto.address?.trim() || "",
    };

    await LogService.record({
      idCabang: newCustomer.idCabang,
      user: actor,
      module: "Customers",
      action: "CREATE",
      targetId: res.insertId,
      description: `Registered customer "${newCustomer.name}" (${newCustomer.phone})`,
      metadata: newCustomer,
    });

    return newCustomer;
  }

  static async updateCustomer(id: number, dto: CustomerDto, actor: SessionUser) {
    await pool.query(
      `UPDATE customers SET id_cabang = ?, name = ?, phone = ?, address = ?, updated_at = NOW() WHERE id = ?`,
      [
        dto.idCabang || actor.idCabang,
        dto.name.trim(),
        dto.phone.trim(),
        dto.address?.trim() || "",
        id,
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang || actor.idCabang,
      user: actor,
      module: "Customers",
      action: "UPDATE",
      targetId: id,
      description: `Updated customer "${dto.name}" (${dto.phone})`,
      metadata: { id, ...dto },
    });
  }

  static async deleteCustomer(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(`SELECT * FROM customers WHERE id = ?`, [id]);
    await pool.query(
      `UPDATE customers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );
    await LogService.record({
      idCabang: rows[0]?.id_cabang || actor.idCabang,
      user: actor,
      module: "Customers",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Soft-deleted customer "${rows[0]?.name || id}" (${rows[0]?.phone || ""})`,
    });
  }
}
