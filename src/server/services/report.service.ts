import { pool } from "@/db";
import { SessionUser } from "@/lib/auth";

export class ReportService {
  static async getDashboardSummary(params: {
    idCabang: number;
    actor: SessionUser;
    startDate?: string;
    endDate?: string;
  }) {
    const { idCabang, actor, startDate, endDate } = params;
    const userFilterSql =
      actor.role === "employee" ? `AND t.user_id = ${Number(actor.id)}` : "";

    let dateFilterSql = "";
    const filterParams: any[] = [idCabang, idCabang];
    if (startDate) {
      dateFilterSql += ` AND DATE(t.created_at) >= ?`;
      filterParams.push(startDate);
    }
    if (endDate) {
      dateFilterSql += ` AND DATE(t.created_at) <= ?`;
      filterParams.push(endDate);
    }

    const [totals]: any = await pool.query(
      `SELECT
         COALESCE(SUM(t.gross_total), 0) as grossRevenue,
         COALESCE(SUM(t.discount_total), 0) as totalDiscount,
         COALESCE(SUM(t.tax_amount), 0) as totalTax,
         COALESCE(SUM(t.net_total), 0) as netRevenue,
         COUNT(t.id) as totalTransactions,
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.net_total ELSE 0 END), 0) as todayNetRevenue,
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.tax_amount ELSE 0 END), 0) as todayTaxRevenue,
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.gross_total ELSE 0 END), 0) as todayGrossRevenue
       FROM transactions t
       WHERE t.deleted_at IS NULL AND (? = 0 OR t.id_cabang = ?) ${userFilterSql} ${dateFilterSql}`,
      filterParams
    );

    const [stockSummary]: any = await pool.query(
      `SELECT
         COUNT(p.id) as totalProducts,
         COALESCE(SUM(p.stock), 0) as totalUnitsInStock,
         SUM(CASE WHEN p.stock <= 10 THEN 1 ELSE 0 END) as lowStockCount
       FROM products p
       WHERE p.deleted_at IS NULL AND (? = 0 OR p.id_cabang = ?)`,
      [idCabang, idCabang]
    );

    const [lowStockProducts]: any = await pool.query(
      `SELECT p.id, p.product_code as productCode, p.name, p.image, p.stock, p.price,
              c.name as categoryName, sc.name as subCategoryName, br.name as brandName
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
       LEFT JOIN brands br ON p.brand_id = br.id
       WHERE p.deleted_at IS NULL AND (? = 0 OR p.id_cabang = ?) AND p.stock <= 10
       ORDER BY p.stock ASC, p.id DESC
       LIMIT 20`,
      [idCabang, idCabang]
    );

    const [chartRows]: any = await pool.query(
      `SELECT
         DATE_FORMAT(t.created_at, '%b %d') as label,
         DATE(t.created_at) as rawDate,
         COALESCE(SUM(t.gross_total), 0) as grossRevenue,
         COALESCE(SUM(t.net_total), 0) as netRevenue,
         COUNT(t.id) as transactions
       FROM transactions t
       WHERE t.deleted_at IS NULL AND (? = 0 OR t.id_cabang = ?) ${userFilterSql} ${dateFilterSql}
       GROUP BY DATE(t.created_at), DATE_FORMAT(t.created_at, '%b %d')
       ORDER BY rawDate ASC
       LIMIT 31`,
      filterParams
    );

    const [topProducts]: any = await pool.query(
      `SELECT
         ti.product_id as productId,
         ti.product_name as productName,
         ti.product_code as productCode,
         SUM(ti.qty) as totalQtySold,
         SUM(ti.net_subtotal) as totalNetRevenue
       FROM transaction_items ti
       INNER JOIN transactions t ON ti.transaction_id = t.id
       WHERE t.deleted_at IS NULL AND ti.deleted_at IS NULL
         AND (? = 0 OR t.id_cabang = ?) ${userFilterSql} ${dateFilterSql}
       GROUP BY ti.product_id, ti.product_name, ti.product_code
       ORDER BY totalQtySold DESC
       LIMIT 6`,
      filterParams
    );

    return {
      overview: {
        grossRevenue: Number(totals[0]?.grossRevenue || 0),
        totalDiscount: Number(totals[0]?.totalDiscount || 0),
        totalTax: Number(totals[0]?.totalTax || 0),
        netRevenue: Number(totals[0]?.netRevenue || 0),
        totalTransactions: Number(totals[0]?.totalTransactions || 0),
        todayNetRevenue: Number(totals[0]?.todayNetRevenue || 0),
        todayTaxRevenue: Number(totals[0]?.todayTaxRevenue || 0),
        todayGrossRevenue: Number(totals[0]?.todayGrossRevenue || 0),
        totalProducts: Number(stockSummary[0]?.totalProducts || 0),
        totalUnitsInStock: Number(stockSummary[0]?.totalUnitsInStock || 0),
        lowStockCount: Number(stockSummary[0]?.lowStockCount || 0),
      },
      chartData: chartRows.map((r: any) => ({
        label: r.label,
        grossRevenue: Number(r.grossRevenue),
        netRevenue: Number(r.netRevenue),
        transactions: Number(r.transactions),
      })),
      topProducts,
      lowStockProducts,
    };
  }

  static async getReportData(params: {
    idCabang: number;
    actor: SessionUser;
    startDate?: string;
    endDate?: string;
    cashierId?: number;
  }) {
    const { idCabang, actor, startDate, endDate, cashierId } = params;
    let userFilterSql = "";
    if (actor.role === "employee") {
      userFilterSql = `AND t.user_id = ${Number(actor.id)}`;
    } else if (cashierId && cashierId > 0) {
      userFilterSql = `AND t.user_id = ${Number(cashierId)}`;
    }

    const [periodMetrics]: any = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.net_total ELSE 0 END), 0) as dailyNet,
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.gross_total ELSE 0 END), 0) as dailyGross,
         COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN t.tax_amount ELSE 0 END), 0) as dailyTax,
         SUM(CASE WHEN DATE(t.created_at) = CURDATE() THEN 1 ELSE 0 END) as dailyCount,

         COALESCE(SUM(CASE WHEN t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN t.net_total ELSE 0 END), 0) as weeklyNet,
         COALESCE(SUM(CASE WHEN t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN t.gross_total ELSE 0 END), 0) as weeklyGross,
         COALESCE(SUM(CASE WHEN t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN t.tax_amount ELSE 0 END), 0) as weeklyTax,
         SUM(CASE WHEN t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as weeklyCount,

         COALESCE(SUM(CASE WHEN YEAR(t.created_at) = YEAR(CURDATE()) AND MONTH(t.created_at) = MONTH(CURDATE()) THEN t.net_total ELSE 0 END), 0) as monthlyNet,
         COALESCE(SUM(CASE WHEN YEAR(t.created_at) = YEAR(CURDATE()) AND MONTH(t.created_at) = MONTH(CURDATE()) THEN t.gross_total ELSE 0 END), 0) as monthlyGross,
         COALESCE(SUM(CASE WHEN YEAR(t.created_at) = YEAR(CURDATE()) AND MONTH(t.created_at) = MONTH(CURDATE()) THEN t.tax_amount ELSE 0 END), 0) as monthlyTax,
         SUM(CASE WHEN YEAR(t.created_at) = YEAR(CURDATE()) AND MONTH(t.created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) as monthlyCount
       FROM transactions t
       WHERE t.deleted_at IS NULL AND (? = 0 OR t.id_cabang = ?) ${userFilterSql}`,
      [idCabang, idCabang]
    );

    let listSql = `
      SELECT t.id, t.id_cabang as idCabang, t.invoice_no as invoiceNo, t.user_id as userId,
             t.customer_id as customerId, t.customer_name as customerName, t.customer_phone as customerPhone,
             t.gross_total as grossTotal,
             t.item_discount_total as itemDiscountTotal,
             t.order_discount_type as orderDiscountType,
             t.order_discount_value as orderDiscountValue,
             t.order_discount_amount as orderDiscountAmount,
             t.voucher_code as voucherCode,
             t.voucher_discount_amount as voucherDiscountAmount,
             t.tax_percentage as taxPercentage,
             t.tax_amount as taxAmount,
             t.discount_total as discountTotal,
             t.net_total as netTotal,
             t.payment_method as paymentMethod, t.cash_amount as cashAmount, t.transfer_amount as transferAmount,
             t.bank_account_info as bankAccountInfo, t.change_amount as changeAmount,
             t.created_at as createdAt,
             u.name as cashierName, b.name as branchName,
             (SELECT COALESCE(SUM(ti.qty), 0) FROM transaction_items ti WHERE ti.transaction_id = t.id AND ti.deleted_at IS NULL) as totalItems
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN branches b ON t.id_cabang = b.id
      WHERE t.deleted_at IS NULL AND (? = 0 OR t.id_cabang = ?) ${userFilterSql}
    `;
    const listParams: any[] = [idCabang, idCabang];

    if (startDate) {
      listSql += ` AND DATE(t.created_at) >= ?`;
      listParams.push(startDate);
    }
    if (endDate) {
      listSql += ` AND DATE(t.created_at) <= ?`;
      listParams.push(endDate);
    }
    listSql += ` ORDER BY t.created_at DESC, t.id DESC`;

    const [transactions]: any = await pool.query(listSql, listParams);

    const filteredGross = transactions.reduce(
      (acc: number, r: any) => acc + Number(r.grossTotal || 0),
      0
    );
    const filteredDiscount = transactions.reduce(
      (acc: number, r: any) => acc + Number(r.discountTotal || 0),
      0
    );
    const filteredTax = transactions.reduce(
      (acc: number, r: any) => acc + Number(r.taxAmount || 0),
      0
    );
    const filteredNet = transactions.reduce(
      (acc: number, r: any) => acc + Number(r.netTotal || 0),
      0
    );

    return {
      cards: {
        dailyNet: Number(periodMetrics[0]?.dailyNet || 0),
        dailyGross: Number(periodMetrics[0]?.dailyGross || 0),
        dailyTax: Number(periodMetrics[0]?.dailyTax || 0),
        dailyCount: Number(periodMetrics[0]?.dailyCount || 0),
        weeklyNet: Number(periodMetrics[0]?.weeklyNet || 0),
        weeklyGross: Number(periodMetrics[0]?.weeklyGross || 0),
        weeklyTax: Number(periodMetrics[0]?.weeklyTax || 0),
        weeklyCount: Number(periodMetrics[0]?.weeklyCount || 0),
        monthlyNet: Number(periodMetrics[0]?.monthlyNet || 0),
        monthlyGross: Number(periodMetrics[0]?.monthlyGross || 0),
        monthlyTax: Number(periodMetrics[0]?.monthlyTax || 0),
        monthlyCount: Number(periodMetrics[0]?.monthlyCount || 0),
        filteredGross,
        filteredDiscount,
        filteredTax,
        filteredNet,
      },
      transactions,
    };
  }
}
