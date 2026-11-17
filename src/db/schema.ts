import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  boolean,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const branches = mysqlTable(
  "branches",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").default(1).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    isMain: boolean("is_main").default(false).notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_branches_deleted").on(table.deletedAt),
    index("idx_branches_code").on(table.code),
  ]
);

export const users = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    username: varchar("username", { length: 100 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    role: varchar("role", { length: 30 }).default("employee").notNull(), // 'admin' | 'employee'
    avatar: varchar("avatar", { length: 500 }),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_users_cabang_deleted").on(table.idCabang, table.deletedAt),
    index("idx_users_username").on(table.username),
  ]
);

export const customers = mysqlTable(
  "customers",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    address: text("address"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_customers_cabang_deleted").on(table.idCabang, table.deletedAt),
    index("idx_customers_name_phone").on(table.name, table.phone),
  ]
);

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_categories_cabang_deleted").on(table.idCabang, table.deletedAt),
  ]
);

export const subCategories = mysqlTable(
  "sub_categories",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    categoryId: int("category_id").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_subcategories_cabang_deleted").on(
      table.idCabang,
      table.deletedAt
    ),
    index("idx_subcategories_category").on(table.categoryId),
  ]
);

export const brands = mysqlTable(
  "brands",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_brands_cabang_deleted").on(table.idCabang, table.deletedAt),
  ]
);

export const products = mysqlTable(
  "products",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    productCode: varchar("product_code", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    image: varchar("image", { length: 500 }),
    categoryId: int("category_id").notNull(),
    subCategoryId: int("sub_category_id").notNull(),
    brandId: int("brand_id").notNull(),
    stock: int("stock").default(0).notNull(),
    price: decimal("price", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_products_cabang_deleted").on(table.idCabang, table.deletedAt),
    index("idx_products_code").on(table.productCode),
    index("idx_products_name").on(table.name),
    index("idx_products_filters").on(
      table.categoryId,
      table.subCategoryId,
      table.brandId
    ),
  ]
);

export const stockIns = mysqlTable(
  "stock_ins",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    referenceNo: varchar("reference_no", { length: 100 }).notNull(),
    invoiceNo: varchar("invoice_no", { length: 100 }),
    productId: int("product_id"),
    qty: int("qty").default(0).notNull(),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    previousStock: int("previous_stock").default(0).notNull(),
    newStock: int("new_stock").default(0).notNull(),
    supplier: varchar("supplier", { length: 150 }),
    invoiceFile: varchar("invoice_file", { length: 500 }),
    invoiceFileName: varchar("invoice_file_name", { length: 255 }),
    totalItems: int("total_items").default(1).notNull(),
    note: text("note"),
    userId: int("user_id").notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_stock_ins_cabang_deleted").on(table.idCabang, table.deletedAt),
    index("idx_stock_ins_product").on(table.productId),
    index("idx_stock_ins_supplier").on(table.supplier),
  ]
);

export const stockInItems = mysqlTable(
  "stock_in_items",
  {
    id: int("id").primaryKey().autoincrement(),
    stockInId: int("stock_in_id").notNull(),
    productId: int("product_id").notNull(),
    qty: int("qty").notNull(),
    costPrice: decimal("cost_price", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    subtotal: decimal("subtotal", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    previousStock: int("previous_stock").default(0).notNull(),
    newStock: int("new_stock").default(0).notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_stock_in_items_stock_in").on(table.stockInId),
    index("idx_stock_in_items_product").on(table.productId),
  ]
);

export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    invoiceNo: varchar("invoice_no", { length: 100 }).notNull(),
    userId: int("user_id").notNull(),
    customerId: int("customer_id"),
    customerName: varchar("customer_name", { length: 150 })
      .default("Walk-in Customer")
      .notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }),
    grossTotal: decimal("gross_total", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    itemDiscountTotal: decimal("item_discount_total", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    orderDiscountType: varchar("order_discount_type", { length: 20 })
      .default("rm")
      .notNull(),
    orderDiscountValue: decimal("order_discount_value", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    orderDiscountAmount: decimal("order_discount_amount", {
      precision: 15,
      scale: 2,
    })
      .default("0.00")
      .notNull(),
    discountTotal: decimal("discount_total", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    netTotal: decimal("net_total", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    paymentMethod: varchar("payment_method", { length: 30 })
      .default("cash")
      .notNull(), // 'cash' | 'transfer' | 'qr_pay'
    cashAmount: decimal("cash_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    transferAmount: decimal("transfer_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    bankAccountInfo: varchar("bank_account_info", { length: 255 }),
    changeAmount: decimal("change_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    notes: text("notes"),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_tx_cabang_deleted_created").on(
      table.idCabang,
      table.deletedAt,
      table.createdAt
    ),
    index("idx_tx_user_deleted").on(table.userId, table.deletedAt),
    index("idx_tx_customer").on(table.customerId),
    index("idx_tx_invoice").on(table.invoiceNo),
  ]
);

export const transactionItems = mysqlTable(
  "transaction_items",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    transactionId: int("transaction_id").notNull(),
    productId: int("product_id").notNull(),
    productCode: varchar("product_code", { length: 100 }).notNull(),
    productName: varchar("product_name", { length: 255 }).notNull(),
    originalPrice: decimal("original_price", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    customPrice: decimal("custom_price", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    qty: int("qty").default(1).notNull(),
    discountType: varchar("discount_type", { length: 20 })
      .default("rm")
      .notNull(), // 'rm' | 'percent'
    discountValue: decimal("discount_value", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    discountAmount: decimal("discount_amount", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    grossSubtotal: decimal("gross_subtotal", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    netSubtotal: decimal("net_subtotal", { precision: 15, scale: 2 })
      .default("0.00")
      .notNull(),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_tx_items_tx_id").on(table.transactionId, table.deletedAt),
    index("idx_tx_items_product").on(table.productId),
  ]
);

export const websiteSettings = mysqlTable(
  "website_settings",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    siteName: varchar("site_name", { length: 150 })
      .default("GUNDAM BASE POS")
      .notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 150 }),
    bankName: varchar("bank_name", { length: 150 }),
    bankAccountNumber: varchar("bank_account_number", { length: 100 }),
    bankAccountHolder: varchar("bank_account_holder", { length: 150 }),
    secondaryBanks: text("secondary_banks"),
    receiptFooter: text("receipt_footer"),
    updatedAt: datetime("updated_at")
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [index("idx_settings_cabang").on(table.idCabang)]
);

export const activityLogs = mysqlTable(
  "activity_logs",
  {
    id: int("id").primaryKey().autoincrement(),
    idCabang: int("id_cabang").notNull(),
    userId: int("user_id"),
    userName: varchar("user_name", { length: 150 }),
    userRole: varchar("user_role", { length: 50 }),
    module: varchar("module", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    targetId: int("target_id"),
    description: text("description").notNull(),
    metadata: text("metadata"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: datetime("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    deletedAt: datetime("deleted_at"),
    deletedBy: int("deleted_by"),
  },
  (table) => [
    index("idx_logs_cabang_created").on(
      table.idCabang,
      table.deletedAt,
      table.createdAt
    ),
    index("idx_logs_module_action").on(table.module, table.action),
  ]
);
