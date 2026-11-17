import { pool } from "@/db";
import { CreateTransactionDto, UpdateTransactionDto } from "../dtos/pos.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class TransactionService {
  static async listTransactions(params: {
    idCabang: number;
    actor: SessionUser;
    startDate?: string;
    endDate?: string;
  }) {
    const { idCabang, actor, startDate, endDate } = params;
    let query = `
      SELECT t.id, t.id_cabang as idCabang, t.invoice_no as invoiceNo, t.user_id as userId,
             t.customer_id as customerId, t.customer_name as customerName, t.customer_phone as customerPhone,
             t.gross_total as grossTotal,
             t.item_discount_total as itemDiscountTotal,
             t.order_discount_type as orderDiscountType,
             t.order_discount_value as orderDiscountValue,
             t.order_discount_amount as orderDiscountAmount,
             t.voucher_id as voucherId,
             t.voucher_code as voucherCode,
             t.voucher_discount_amount as voucherDiscountAmount,
             t.discount_total as discountTotal,
             t.net_total as netTotal,
             t.payment_method as paymentMethod, t.cash_amount as cashAmount, t.transfer_amount as transferAmount,
             t.bank_account_info as bankAccountInfo, t.change_amount as changeAmount, t.notes,
             t.created_at as createdAt,
             u.name as cashierName, u.username as cashierUsername,
             b.name as branchName, b.code as branchCode
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN branches b ON t.id_cabang = b.id
      WHERE t.deleted_at IS NULL AND (? = 0 OR t.id_cabang = ?)
    `;
    const queryParams: any[] = [idCabang, idCabang];

    if (actor.role === "employee") {
      query += ` AND t.user_id = ?`;
      queryParams.push(actor.id);
    }

    if (startDate) {
      query += ` AND DATE(t.created_at) >= ?`;
      queryParams.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(t.created_at) <= ?`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY t.created_at DESC, t.id DESC`;

    const [txRows]: any = await pool.query(query, queryParams);
    if (txRows.length === 0) return [];

    const txIds = txRows.map((r: any) => r.id);
    const [itemRows]: any = await pool.query(
      `SELECT id, id_cabang as idCabang, transaction_id as transactionId, product_id as productId,
              product_code as productCode, product_name as productName,
              original_price as originalPrice, custom_price as customPrice,
              qty, discount_type as discountType, discount_value as discountValue,
              discount_amount as discountAmount, gross_subtotal as grossSubtotal, net_subtotal as netSubtotal
       FROM transaction_items
       WHERE transaction_id IN (?) AND deleted_at IS NULL`,
      [txIds]
    );

    const itemsByTx = new Map<number, any[]>();
    for (const item of itemRows) {
      const list = itemsByTx.get(item.transactionId) || [];
      list.push(item);
      itemsByTx.set(item.transactionId, list);
    }

    return txRows.map((tx: any) => ({
      ...tx,
      items: itemsByTx.get(tx.id) || [],
    }));
  }

  static async getTransactionById(id: number) {
    const [txRows]: any = await pool.query(
      `SELECT t.id, t.id_cabang as idCabang, t.invoice_no as invoiceNo, t.user_id as userId,
             t.customer_id as customerId, t.customer_name as customerName, t.customer_phone as customerPhone,
             t.gross_total as grossTotal,
             t.item_discount_total as itemDiscountTotal,
             t.order_discount_type as orderDiscountType,
             t.order_discount_value as orderDiscountValue,
             t.order_discount_amount as orderDiscountAmount,
             t.voucher_id as voucherId,
             t.voucher_code as voucherCode,
             t.voucher_discount_amount as voucherDiscountAmount,
             t.discount_total as discountTotal,
             t.net_total as netTotal,
             t.payment_method as paymentMethod, t.cash_amount as cashAmount, t.transfer_amount as transferAmount,
             t.bank_account_info as bankAccountInfo, t.change_amount as changeAmount, t.notes,
             t.created_at as createdAt,
             u.name as cashierName, u.username as cashierUsername,
             b.name as branchName, b.code as branchCode, b.address as branchAddress, b.phone as branchPhone
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN branches b ON t.id_cabang = b.id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    if (!txRows[0]) return null;

    const [items]: any = await pool.query(
      `SELECT id, id_cabang as idCabang, transaction_id as transactionId, product_id as productId,
              product_code as productCode, product_name as productName,
              original_price as originalPrice, custom_price as customPrice,
              qty, discount_type as discountType, discount_value as discountValue,
              discount_amount as discountAmount, gross_subtotal as grossSubtotal, net_subtotal as netSubtotal
       FROM transaction_items
       WHERE transaction_id = ? AND deleted_at IS NULL`,
      [id]
    );

    return {
      ...txRows[0],
      items,
    };
  }

  static async createTransaction(dto: CreateTransactionDto, actor: SessionUser) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error("Cart is empty. Please add at least one product.");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let grossTotal = 0;
      let itemDiscountTotal = 0;
      const priceOverrides: Array<{
        productName: string;
        originalPrice: number;
        customPrice: number;
      }> = [];

      for (const item of dto.items) {
        const [prodRows]: any = await conn.query(
          `SELECT id, name, stock, price FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
          [item.productId]
        );
        const prod = prodRows[0];
        if (!prod) {
          throw new Error(`Product "${item.productName}" is no longer available`);
        }
        if (prod.stock < item.qty) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.qty}`
          );
        }

        const customPrice = Number(item.customPrice);
        const originalPrice = Number(prod.price);
        const qty = Number(item.qty);
        const discount = Number(item.discountAmount || 0);

        if (Math.abs(customPrice - originalPrice) > 0.001) {
          priceOverrides.push({
            productName: prod.name,
            originalPrice,
            customPrice,
          });
        }

        grossTotal += customPrice * qty;
        itemDiscountTotal += discount;

        await conn.query(
          `UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?`,
          [qty, item.productId]
        );
      }

      const subtotalAfterItemDisc = Math.max(0, grossTotal - itemDiscountTotal);

      // Voucher Discount
      let voucherId = dto.voucherId || null;
      let voucherCode = dto.voucherCode?.trim().toUpperCase() || null;
      let voucherDiscountAmount = Math.max(
        0,
        Number(dto.voucherDiscountAmount || 0)
      );

      if (voucherId || voucherCode) {
        const [vRows]: any = await conn.query(
          `SELECT id, code, usage_limit, usage_count, once_per_customer FROM vouchers WHERE (id = ? OR UPPER(code) = ?) AND deleted_at IS NULL`,
          [voucherId || 0, voucherCode || ""]
        );
        const vRec = vRows[0];
        if (vRec) {
          voucherId = vRec.id;
          voucherCode = vRec.code;

          // Check usage limit
          if (vRec.usage_limit > 0 && vRec.usage_count >= vRec.usage_limit) {
            throw new Error(
              `Voucher "${voucherCode}" has reached its maximum total usage limit (${vRec.usage_limit}).`
            );
          }

          // Check once per customer flag
          if (vRec.once_per_customer === 1) {
            const custId =
              dto.customerId && String(dto.customerId) !== "walk-in" && !isNaN(Number(dto.customerId))
                ? Number(dto.customerId)
                : null;
            const custPhone = dto.customerPhone?.trim() || "";

            if (custId || custPhone) {
              const [priorUse]: any = await conn.query(
                `SELECT id, invoice_no, customer_name FROM transactions
                 WHERE voucher_id = ?
                   AND ((? IS NOT NULL AND customer_id = ?) OR (? != '' AND customer_phone = ?))
                   AND deleted_at IS NULL
                 LIMIT 1`,
                [voucherId, custId, custId, custPhone, custPhone]
              );
              if (priorUse.length > 0) {
                throw new Error(
                  `Customer "${dto.customerName || custPhone}" has already redeemed voucher "${voucherCode}" (Invoice: ${priorUse[0].invoice_no}). This voucher is limited to 1 use per customer.`
                );
              }
            }
          }
        }
      }

      const subtotalAfterVoucher = Math.max(
        0,
        subtotalAfterItemDisc - voucherDiscountAmount
      );

      const orderDiscountType =
        dto.orderDiscountType === "percent" ? "percent" : "rm";
      const orderDiscountValue = Math.max(
        0,
        Number(dto.orderDiscountValue || 0)
      );
      const orderDiscountAmount =
        orderDiscountType === "percent"
          ? Number(
              (
                (subtotalAfterVoucher * Math.min(100, orderDiscountValue)) /
                100
              ).toFixed(2)
            )
          : Math.min(subtotalAfterVoucher, orderDiscountValue);

      const discountTotal = Number(
        (itemDiscountTotal + voucherDiscountAmount + orderDiscountAmount).toFixed(2)
      );
      const netTotal = Math.max(0, grossTotal - discountTotal);

      let cashAmount = Number(dto.cashAmount || 0);
      let transferAmount = Number(dto.transferAmount || 0);
      let changeAmount = 0;

      if (dto.paymentMethod === "cash") {
        transferAmount = 0;
        if (cashAmount < netTotal) {
          cashAmount = netTotal;
        }
        changeAmount = Math.max(0, cashAmount - netTotal);
      } else if (
        dto.paymentMethod === "transfer" ||
        dto.paymentMethod === "qr_pay"
      ) {
        cashAmount = 0;
        transferAmount = netTotal;
        changeAmount = 0;
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `INV-${dto.idCabang}-${dateStr}-${randSuffix}`;

      const [txRes]: any = await conn.query(
        `INSERT INTO transactions
         (id_cabang, invoice_no, user_id, customer_id, customer_name, customer_phone,
          gross_total, item_discount_total, order_discount_type, order_discount_value, order_discount_amount,
          voucher_id, voucher_code, voucher_discount_amount, discount_total, net_total,
          payment_method, cash_amount, transfer_amount, bank_account_info, change_amount, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.idCabang,
          invoiceNo,
          actor.id,
          dto.customerId || null,
          dto.customerName || "Walk-in Customer",
          dto.customerPhone || null,
          grossTotal,
          itemDiscountTotal,
          orderDiscountType,
          orderDiscountValue,
          orderDiscountAmount,
          voucherId,
          voucherCode,
          voucherDiscountAmount,
          discountTotal,
          netTotal,
          dto.paymentMethod,
          cashAmount,
          transferAmount,
          dto.bankAccountInfo || null,
          changeAmount,
          dto.notes || null,
        ]
      );

      const txId = txRes.insertId;

      if (voucherId) {
        await conn.query(
          `UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = ?`,
          [voucherId]
        );
      }

      for (const item of dto.items) {
        const customPrice = Number(item.customPrice);
        const qty = Number(item.qty);
        const discount = Number(item.discountAmount || 0);
        const grossSub = customPrice * qty;
        const netSub = Math.max(0, grossSub - discount);

        await conn.query(
          `INSERT INTO transaction_items
           (id_cabang, transaction_id, product_id, product_code, product_name, original_price, custom_price, qty, discount_type, discount_value, discount_amount, gross_subtotal, net_subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dto.idCabang,
            txId,
            item.productId,
            item.productCode,
            item.productName,
            Number(item.originalPrice),
            customPrice,
            qty,
            item.discountType || "rm",
            Number(item.discountValue ?? discount),
            discount,
            grossSub,
            netSub,
          ]
        );
      }

      await conn.commit();

      for (const po of priceOverrides) {
        await LogService.record({
          idCabang: dto.idCabang,
          user: actor,
          module: "POS",
          action: "PRICE_OVERRIDE",
          targetId: txId,
          description: `Modified unit price in POS for "${po.productName}" from RM ${po.originalPrice.toFixed(2)} to RM ${po.customPrice.toFixed(2)} on Invoice ${invoiceNo}`,
          metadata: { invoiceNo, ...po },
        });
      }

      await LogService.record({
        idCabang: dto.idCabang,
        user: actor,
        module: "POS",
        action: "POS_CHECKOUT",
        targetId: txId,
        description: `Completed ${dto.paymentMethod.toUpperCase()} transaction ${invoiceNo} for "${dto.customerName || "Walk-in Customer"}" (Gross: RM ${grossTotal.toFixed(2)}, Item Disc: RM ${itemDiscountTotal.toFixed(2)}, Order Disc: RM ${orderDiscountAmount.toFixed(2)}, Net: RM ${netTotal.toFixed(2)})`,
        metadata: {
          invoiceNo,
          customerId: dto.customerId,
          customerName: dto.customerName,
          grossTotal,
          itemDiscountTotal,
          orderDiscountAmount,
          discountTotal,
          netTotal,
          paymentMethod: dto.paymentMethod,
          itemCount: dto.items.length,
        },
      });

      return await this.getTransactionById(txId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async updateTransaction(dto: UpdateTransactionDto, actor: SessionUser) {
    if (!dto.items || dto.items.length === 0) {
      throw new Error("Transaction must contain at least one item");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existingTxRows]: any = await conn.query(
        `SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
        [dto.id]
      );
      const existingTx = existingTxRows[0];
      if (!existingTx) {
        throw new Error("Transaction not found");
      }

      const [oldItems]: any = await conn.query(
        `SELECT * FROM transaction_items WHERE transaction_id = ? AND deleted_at IS NULL`,
        [dto.id]
      );
      for (const oldItem of oldItems) {
        await conn.query(
          `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`,
          [oldItem.qty, oldItem.product_id]
        );
      }

      await conn.query(
        `UPDATE transaction_items SET deleted_at = NOW(), deleted_by = ? WHERE transaction_id = ? AND deleted_at IS NULL`,
        [actor.id, dto.id]
      );

      let grossTotal = 0;
      let itemDiscountTotal = 0;

      for (const item of dto.items) {
        const [prodRows]: any = await conn.query(
          `SELECT id, name, stock, price FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
          [item.productId]
        );
        const prod = prodRows[0];
        if (!prod) {
          throw new Error(`Product "${item.productName}" not found`);
        }
        if (prod.stock < item.qty) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.qty}`
          );
        }

        const customPrice = Number(item.customPrice);
        const qty = Number(item.qty);
        const discount = Number(item.discountAmount || 0);
        const grossSub = customPrice * qty;
        const netSub = Math.max(0, grossSub - discount);

        grossTotal += grossSub;
        itemDiscountTotal += discount;

        await conn.query(
          `UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?`,
          [qty, item.productId]
        );

        await conn.query(
          `INSERT INTO transaction_items
           (id_cabang, transaction_id, product_id, product_code, product_name, original_price, custom_price, qty, discount_type, discount_value, discount_amount, gross_subtotal, net_subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            existingTx.id_cabang,
            dto.id,
            item.productId,
            item.productCode,
            item.productName,
            Number(item.originalPrice),
            customPrice,
            qty,
            item.discountType || "rm",
            Number(item.discountValue ?? discount),
            discount,
            grossSub,
            netSub,
          ]
        );
      }

      const subtotalAfterItemDisc = Math.max(0, grossTotal - itemDiscountTotal);

      // Voucher Discount
      let voucherId = dto.voucherId || null;
      let voucherCode = dto.voucherCode?.trim().toUpperCase() || null;
      let voucherDiscountAmount = Math.max(
        0,
        Number(dto.voucherDiscountAmount || 0)
      );

      if (voucherCode && !voucherId) {
        const [vRows]: any = await conn.query(
          `SELECT id FROM vouchers WHERE UPPER(code) = ? AND deleted_at IS NULL`,
          [voucherCode]
        );
        if (vRows[0]) {
          voucherId = vRows[0].id;
        }
      }

      const subtotalAfterVoucher = Math.max(
        0,
        subtotalAfterItemDisc - voucherDiscountAmount
      );

      const orderDiscountType =
        dto.orderDiscountType === "percent" ? "percent" : "rm";
      const orderDiscountValue = Math.max(
        0,
        Number(dto.orderDiscountValue || 0)
      );
      const orderDiscountAmount =
        orderDiscountType === "percent"
          ? Number(
              (
                (subtotalAfterVoucher * Math.min(100, orderDiscountValue)) /
                100
              ).toFixed(2)
            )
          : Math.min(subtotalAfterVoucher, orderDiscountValue);

      const discountTotal = Number(
        (itemDiscountTotal + voucherDiscountAmount + orderDiscountAmount).toFixed(2)
      );
      const netTotal = Math.max(0, grossTotal - discountTotal);

      let cashAmount = Number(dto.cashAmount || 0);
      let transferAmount = Number(dto.transferAmount || 0);
      let changeAmount = 0;

      if (dto.paymentMethod === "cash") {
        transferAmount = 0;
        if (cashAmount < netTotal) cashAmount = netTotal;
        changeAmount = Math.max(0, cashAmount - netTotal);
      } else if (
        dto.paymentMethod === "transfer" ||
        dto.paymentMethod === "qr_pay"
      ) {
        cashAmount = 0;
        transferAmount = netTotal;
        changeAmount = 0;
      }

      await conn.query(
        `UPDATE transactions
         SET customer_id = ?, customer_name = ?, customer_phone = ?,
             gross_total = ?, item_discount_total = ?, order_discount_type = ?, order_discount_value = ?, order_discount_amount = ?,
             voucher_id = ?, voucher_code = ?, voucher_discount_amount = ?,
             discount_total = ?, net_total = ?,
             payment_method = ?, cash_amount = ?, transfer_amount = ?, bank_account_info = ?, change_amount = ?, notes = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          dto.customerId || null,
          dto.customerName || "Walk-in Customer",
          dto.customerPhone || null,
          grossTotal,
          itemDiscountTotal,
          orderDiscountType,
          orderDiscountValue,
          orderDiscountAmount,
          voucherId,
          voucherCode,
          voucherDiscountAmount,
          discountTotal,
          netTotal,
          dto.paymentMethod,
          cashAmount,
          transferAmount,
          dto.bankAccountInfo || null,
          changeAmount,
          dto.notes || null,
          dto.id,
        ]
      );

      await conn.commit();

      await LogService.record({
        idCabang: existingTx.id_cabang,
        user: actor,
        module: "Transactions",
        action: "TRANSACTION_EDIT",
        targetId: dto.id,
        description: `Edited transaction ${existingTx.invoice_no} (Previous Net: RM ${Number(existingTx.net_total).toFixed(2)} -> New Net: RM ${netTotal.toFixed(2)})`,
        metadata: {
          invoiceNo: existingTx.invoice_no,
          previousNetTotal: existingTx.net_total,
          newNetTotal: netTotal,
          discountTotal,
          paymentMethod: dto.paymentMethod,
        },
      });

      return await this.getTransactionById(dto.id);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async deleteTransaction(id: number, actor: SessionUser) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [txRows]: any = await conn.query(
        `SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL FOR UPDATE`,
        [id]
      );
      const tx = txRows[0];
      if (!tx) throw new Error("Transaction not found");

      const [items]: any = await conn.query(
        `SELECT * FROM transaction_items WHERE transaction_id = ? AND deleted_at IS NULL`,
        [id]
      );

      for (const item of items) {
        await conn.query(
          `UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?`,
          [item.qty, item.product_id]
        );
      }

      await conn.query(
        `UPDATE transactions SET deleted_at = NOW(), deleted_by = ? WHERE id = ?`,
        [actor.id, id]
      );

      await conn.commit();

      await LogService.record({
        idCabang: tx.id_cabang,
        user: actor,
        module: "Transactions",
        action: "SOFT_DELETE",
        targetId: id,
        description: `Moved transaction ${tx.invoice_no} (Net: RM ${Number(tx.net_total).toFixed(2)}) to Trash and restored item stock`,
        metadata: {
          invoiceNo: tx.invoice_no,
          netTotal: tx.net_total,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
