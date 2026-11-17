-- Migration: 0000_initial_schema.sql
-- Database: pos_gundam (MySQL / MariaDB)
-- High-Performance Indexed Schema with Multi-Branch (id_cabang) on ALL tables & Soft Delete (deleted_at, deleted_by)

CREATE TABLE IF NOT EXISTS `branches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL DEFAULT 1,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `is_main` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_branches_deleted` (`deleted_at`),
  INDEX `idx_branches_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `role` VARCHAR(30) NOT NULL DEFAULT 'employee',
  `avatar` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_users_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_customers_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_customers_name_phone` (`name`, `phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_categories_cabang_deleted` (`id_cabang`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sub_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_subcategories_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_subcategories_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `brands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_brands_cabang_deleted` (`id_cabang`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `product_code` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `image` VARCHAR(500) NULL,
  `category_id` INT NOT NULL,
  `sub_category_id` INT NOT NULL,
  `brand_id` INT NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_products_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_products_code` (`product_code`),
  INDEX `idx_products_name` (`name`),
  INDEX `idx_products_filters` (`category_id`, `sub_category_id`, `brand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_ins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `reference_no` VARCHAR(100) NOT NULL,
  `invoice_no` VARCHAR(100) NULL,
  `product_id` INT NULL,
  `qty` INT NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `previous_stock` INT NOT NULL DEFAULT 0,
  `new_stock` INT NOT NULL DEFAULT 0,
  `supplier` VARCHAR(150) NULL,
  `invoice_file` VARCHAR(500) NULL,
  `invoice_file_name` VARCHAR(255) NULL,
  `total_items` INT NOT NULL DEFAULT 1,
  `note` TEXT NULL,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_stock_ins_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_stock_ins_product` (`product_id`),
  INDEX `idx_stock_ins_supplier` (`supplier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_in_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stock_in_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `qty` INT NOT NULL,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `previous_stock` INT NOT NULL DEFAULT 0,
  `new_stock` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_stock_in_items_stock_in` (`stock_in_id`),
  INDEX `idx_stock_in_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL DEFAULT 0,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `discount_type` VARCHAR(20) NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `min_spend` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `max_discount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `usage_limit` INT NOT NULL DEFAULT 0,
  `usage_count` INT NOT NULL DEFAULT 0,
  `once_per_customer` TINYINT(1) NOT NULL DEFAULT 0,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_vouchers_cabang_deleted` (`id_cabang`, `deleted_at`),
  INDEX `idx_vouchers_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `invoice_no` VARCHAR(100) NOT NULL,
  `user_id` INT NOT NULL,
  `customer_id` INT NULL,
  `customer_name` VARCHAR(150) NOT NULL DEFAULT 'Walk-in Customer',
  `customer_phone` VARCHAR(50) NULL,
  `gross_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `item_discount_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `order_discount_type` VARCHAR(20) NOT NULL DEFAULT 'rm',
  `order_discount_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `order_discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `voucher_id` INT NULL,
  `voucher_code` VARCHAR(50) NULL,
  `voucher_discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(30) NOT NULL DEFAULT 'cash',
  `cash_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `transfer_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `bank_account_info` VARCHAR(255) NULL,
  `change_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_tx_cabang_deleted_created` (`id_cabang`, `deleted_at`, `created_at`),
  INDEX `idx_tx_user_deleted` (`user_id`, `deleted_at`),
  INDEX `idx_tx_customer` (`customer_id`),
  INDEX `idx_tx_invoice` (`invoice_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transaction_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `transaction_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_code` VARCHAR(100) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `original_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `custom_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `qty` INT NOT NULL DEFAULT 1,
  `discount_type` VARCHAR(20) NOT NULL DEFAULT 'rm',
  `discount_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `gross_subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `net_subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_tx_items_tx_id` (`transaction_id`, `deleted_at`),
  INDEX `idx_tx_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `website_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `site_name` VARCHAR(150) NOT NULL DEFAULT 'GUNDAM BASE POS',
  `logo_url` VARCHAR(500) NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(150) NULL,
  `bank_name` VARCHAR(150) NULL,
  `bank_account_number` VARCHAR(100) NULL,
  `bank_account_holder` VARCHAR(150) NULL,
  `secondary_banks` TEXT NULL,
  `receipt_footer` TEXT NULL,
  `tax_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `tax_name` VARCHAR(50) NOT NULL DEFAULT 'SST',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_settings_cabang` (`id_cabang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `id_cabang` INT NOT NULL,
  `user_id` INT NULL,
  `user_name` VARCHAR(150) NULL,
  `user_role` VARCHAR(50) NULL,
  `module` VARCHAR(100) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_id` INT NULL,
  `description` TEXT NOT NULL,
  `metadata` LONGTEXT NULL,
  `ip_address` VARCHAR(64) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  `deleted_by` INT NULL,
  INDEX `idx_logs_cabang_created` (`id_cabang`, `deleted_at`, `created_at`),
  INDEX `idx_logs_module_action` (`module`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
