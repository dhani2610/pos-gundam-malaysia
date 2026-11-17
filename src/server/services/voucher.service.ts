import { pool } from "@/db";
import { CreateVoucherDto } from "../dtos/voucher.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class VoucherService {
  static async listVouchers(idCabang: number) {
    const [rows]: any = await pool.query(
      `SELECT v.*, b.name as branchName
       FROM vouchers v
       LEFT JOIN branches b ON v.id_cabang = b.id
       WHERE v.deleted_at IS NULL AND (? = 0 OR v.id_cabang = 0 OR v.id_cabang = ?)
       ORDER BY v.id DESC`,
      [idCabang, idCabang]
    );

    const todayStr = new Date().toISOString().slice(0, 10);

    return rows.map((v: any) => {
      let status: "active" | "expired" | "scheduled" | "depleted" | "disabled" =
        "active";

      if (!v.is_active) {
        status = "disabled";
      } else if (v.end_date < todayStr) {
        status = "expired";
      } else if (v.start_date > todayStr) {
        status = "scheduled";
      } else if (v.usage_limit > 0 && v.usage_count >= v.usage_limit) {
        status = "depleted";
      }

      return {
        ...v,
        status,
        discountValue: Number(v.discount_value),
        minSpend: Number(v.min_spend),
        maxDiscount: Number(v.max_discount),
        usageLimit: Number(v.usage_limit),
        usageCount: Number(v.usage_count),
        oncePerCustomer: Number(v.once_per_customer || 0),
      };
    });
  }

  static async getVoucherById(id: number) {
    const [rows]: any = await pool.query(
      `SELECT * FROM vouchers WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    if (!rows[0]) throw new Error("Voucher not found");
    return rows[0];
  }

  static async createVoucher(dto: CreateVoucherDto, actor: SessionUser) {
    const code = dto.code.trim().toUpperCase();
    if (!code) throw new Error("Voucher code is required");
    if (!dto.name.trim()) throw new Error("Voucher name is required");

    const discountVal = Number(dto.discountValue || 0);
    if (discountVal <= 0) {
      throw new Error("Discount value must be greater than 0");
    }

    if (dto.discountType === "percent" && discountVal > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (!dto.startDate || !dto.endDate) {
      throw new Error("Start date and end date are required");
    }

    if (dto.startDate > dto.endDate) {
      throw new Error("Start date cannot be after end date");
    }

    const [existing]: any = await pool.query(
      `SELECT id FROM vouchers WHERE code = ? AND deleted_at IS NULL`,
      [code]
    );
    if (existing.length > 0) {
      throw new Error(`Voucher code "${code}" is already in use`);
    }

    const [res]: any = await pool.query(
      `INSERT INTO vouchers
       (id_cabang, code, name, discount_type, discount_value, min_spend, max_discount, usage_limit, once_per_customer, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.idCabang ?? 0,
        code,
        dto.name.trim(),
        dto.discountType === "percent" ? "percent" : "rm",
        discountVal,
        Number(dto.minSpend || 0),
        Number(dto.maxDiscount || 0),
        Number(dto.usageLimit || 0),
        dto.oncePerCustomer === true || dto.oncePerCustomer === 1 ? 1 : 0,
        dto.startDate,
        dto.endDate,
        dto.isActive === false || dto.isActive === 0 ? 0 : 1,
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang ?? 0,
      user: actor,
      module: "Vouchers",
      action: "CREATE",
      targetId: res.insertId,
      description: `Created voucher "${code}" (${dto.discountType === "percent" ? `${discountVal}%` : `RM ${discountVal}`}) valid from ${dto.startDate} to ${dto.endDate}`,
    });

    return res.insertId;
  }

  static async updateVoucher(
    id: number,
    dto: CreateVoucherDto,
    actor: SessionUser
  ) {
    const code = dto.code.trim().toUpperCase();
    if (!code) throw new Error("Voucher code is required");
    if (!dto.name.trim()) throw new Error("Voucher name is required");

    const discountVal = Number(dto.discountValue || 0);
    if (discountVal <= 0) {
      throw new Error("Discount value must be greater than 0");
    }

    if (dto.discountType === "percent" && discountVal > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (dto.startDate > dto.endDate) {
      throw new Error("Start date cannot be after end date");
    }

    const [existing]: any = await pool.query(
      `SELECT id FROM vouchers WHERE code = ? AND id != ? AND deleted_at IS NULL`,
      [code, id]
    );
    if (existing.length > 0) {
      throw new Error(`Voucher code "${code}" is already in use by another voucher`);
    }

    await pool.query(
      `UPDATE vouchers
       SET id_cabang = ?, code = ?, name = ?, discount_type = ?, discount_value = ?,
           min_spend = ?, max_discount = ?, usage_limit = ?, once_per_customer = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [
        dto.idCabang ?? 0,
        code,
        dto.name.trim(),
        dto.discountType === "percent" ? "percent" : "rm",
        discountVal,
        Number(dto.minSpend || 0),
        Number(dto.maxDiscount || 0),
        Number(dto.usageLimit || 0),
        dto.oncePerCustomer === true || dto.oncePerCustomer === 1 ? 1 : 0,
        dto.startDate,
        dto.endDate,
        dto.isActive === false || dto.isActive === 0 ? 0 : 1,
        id,
      ]
    );

    await LogService.record({
      idCabang: dto.idCabang ?? 0,
      user: actor,
      module: "Vouchers",
      action: "UPDATE",
      targetId: id,
      description: `Updated voucher "${code}" details`,
    });
  }

  static async deleteVoucher(id: number, actor: SessionUser) {
    const [rows]: any = await pool.query(
      `SELECT * FROM vouchers WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    const v = rows[0];
    if (!v) throw new Error("Voucher not found");

    await pool.query(
      `UPDATE vouchers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
      [actor.id, id]
    );

    await LogService.record({
      idCabang: v.id_cabang,
      user: actor,
      module: "Vouchers",
      action: "SOFT_DELETE",
      targetId: id,
      description: `Moved voucher "${v.code}" to Trash`,
    });
  }

  static async validateAndCalculateVoucher(
    code: string,
    idCabang: number,
    subtotal: number,
    customerId?: number | string | null,
    customerPhone?: string | null
  ) {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) throw new Error("Please enter a voucher code");

    const [rows]: any = await pool.query(
      `SELECT * FROM vouchers WHERE UPPER(code) = ? AND deleted_at IS NULL`,
      [cleanCode]
    );

    const v = rows[0];
    if (!v) {
      throw new Error(`Voucher "${cleanCode}" not found or invalid`);
    }

    if (!v.is_active) {
      throw new Error(`Voucher "${cleanCode}" is currently inactive`);
    }

    // Branch scoping: 0 = valid across all branches
    if (v.id_cabang !== 0 && idCabang !== 0 && v.id_cabang !== idCabang) {
      throw new Error(`Voucher "${cleanCode}" is not valid for this store branch`);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const startDateStr = typeof v.start_date === "string" ? v.start_date.slice(0, 10) : new Date(v.start_date).toISOString().slice(0, 10);
    const endDateStr = typeof v.end_date === "string" ? v.end_date.slice(0, 10) : new Date(v.end_date).toISOString().slice(0, 10);

    if (startDateStr > todayStr) {
      throw new Error(`Voucher "${cleanCode}" will be valid starting from ${startDateStr}`);
    }

    if (endDateStr < todayStr) {
      throw new Error(`Voucher "${cleanCode}" expired on ${endDateStr}`);
    }

    if (v.usage_limit > 0 && v.usage_count >= v.usage_limit) {
      throw new Error(`Voucher "${cleanCode}" has reached its maximum usage limit (${v.usage_limit} uses)`);
    }

    // Check once per customer flag
    if (Number(v.once_per_customer || 0) === 1) {
      const cId =
        customerId && String(customerId) !== "walk-in" && !isNaN(Number(customerId))
          ? Number(customerId)
          : null;
      const cPhone = customerPhone?.trim() || "";

      if (cId || cPhone) {
        const [prior]: any = await pool.query(
          `SELECT id, invoice_no, customer_name, customer_phone, created_at FROM transactions
           WHERE voucher_id = ?
             AND ((? IS NOT NULL AND customer_id = ?) OR (? != '' AND customer_phone = ?))
             AND deleted_at IS NULL
           LIMIT 1`,
          [v.id, cId, cId, cPhone, cPhone]
        );
        if (prior.length > 0) {
          throw new Error(
            `Customer "${prior[0].customer_name || 'Selected'}" has already used voucher "${cleanCode}" (Invoice: ${prior[0].invoice_no}). This voucher is limited to 1 use per customer.`
          );
        }
      }
    }

    const minSpend = Number(v.min_spend || 0);
    if (minSpend > 0 && subtotal < minSpend) {
      throw new Error(
        `Voucher "${cleanCode}" requires a minimum spend of RM ${minSpend.toFixed(2)} (Current subtotal: RM ${subtotal.toFixed(2)})`
      );
    }

    // Calculate discount amount
    const discountVal = Number(v.discount_value || 0);
    let discountAmount = 0;

    if (v.discount_type === "percent") {
      discountAmount = (subtotal * discountVal) / 100;
      const maxDiscount = Number(v.max_discount || 0);
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = Math.min(subtotal, discountVal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      voucher: {
        id: v.id,
        code: v.code,
        name: v.name,
        discountType: v.discount_type as "percent" | "rm",
        discountValue: discountVal,
        discountAmount,
        minSpend,
        maxDiscount: Number(v.max_discount || 0),
        usageLimit: Number(v.usage_limit || 0),
        oncePerCustomer: Number(v.once_per_customer || 0),
        startDate: startDateStr,
        endDate: endDateStr,
      },
    };
  }

  static async getVoucherUsageHistory(id: number) {
    const [vRows]: any = await pool.query(
      `SELECT v.*, b.name as branchName
       FROM vouchers v
       LEFT JOIN branches b ON v.id_cabang = b.id
       WHERE v.id = ? AND v.deleted_at IS NULL`,
      [id]
    );
    const voucher = vRows[0];
    if (!voucher) throw new Error("Voucher not found");

    const [txRows]: any = await pool.query(
      `SELECT t.id, t.id_cabang, t.invoice_no, t.customer_id, t.customer_name, t.customer_phone,
              t.gross_total, t.voucher_discount_amount, t.order_discount_amount, t.discount_total,
              t.net_total, t.payment_method, t.created_at,
              u.name as cashier_name, u.username as cashier_username,
              b.name as branch_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN branches b ON t.id_cabang = b.id
       WHERE t.voucher_id = ? AND t.deleted_at IS NULL
       ORDER BY t.created_at DESC`,
      [id]
    );

    let totalDiscountGiven = 0;
    let totalGrossRevenue = 0;
    let totalNetRevenue = 0;
    const customerSet = new Set<string>();

    for (const tx of txRows) {
      totalDiscountGiven += Number(tx.voucher_discount_amount || 0);
      totalGrossRevenue += Number(tx.gross_total || 0);
      totalNetRevenue += Number(tx.net_total || 0);
      const custKey = tx.customer_id
        ? `ID:${tx.customer_id}`
        : tx.customer_phone
          ? `PHONE:${tx.customer_phone}`
          : `NAME:${tx.customer_name}`;
      if (custKey) customerSet.add(custKey);
    }

    return {
      voucher: {
        ...voucher,
        discountValue: Number(voucher.discount_value),
        minSpend: Number(voucher.min_spend),
        maxDiscount: Number(voucher.max_discount),
        usageLimit: Number(voucher.usage_limit),
        usageCount: Number(voucher.usage_count),
        oncePerCustomer: Number(voucher.once_per_customer || 0),
      },
      summary: {
        totalRedemptions: txRows.length,
        totalDiscountGiven: Number(totalDiscountGiven.toFixed(2)),
        totalGrossRevenue: Number(totalGrossRevenue.toFixed(2)),
        totalNetRevenue: Number(totalNetRevenue.toFixed(2)),
        uniqueCustomersCount: customerSet.size,
      },
      redemptions: txRows.map((tx: any) => ({
        id: tx.id,
        invoiceNo: tx.invoice_no,
        idCabang: tx.id_cabang,
        branchName: tx.branch_name || `Branch #${tx.id_cabang}`,
        customerId: tx.customer_id,
        customerName: tx.customer_name || "Walk-in Customer",
        customerPhone: tx.customer_phone || "",
        cashierName: tx.cashier_name || tx.cashier_username || "Cashier",
        grossTotal: Number(tx.gross_total || 0),
        voucherDiscountAmount: Number(tx.voucher_discount_amount || 0),
        orderDiscountAmount: Number(tx.order_discount_amount || 0),
        discountTotal: Number(tx.discount_total || 0),
        netTotal: Number(tx.net_total || 0),
        paymentMethod: tx.payment_method,
        createdAt: tx.created_at,
      })),
    };
  }
}
