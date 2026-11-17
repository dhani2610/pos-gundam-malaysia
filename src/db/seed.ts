import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

function generateGunplaSvg(
  title: string,
  grade: string,
  code: string,
  accentColor: string,
  secondaryColor: string
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="${secondaryColor}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <g stroke="#334155" stroke-width="0.5" opacity="0.35">
    <line x1="0" y1="50" x2="400" y2="50"/>
    <line x1="0" y1="100" x2="400" y2="100"/>
    <line x1="0" y1="150" x2="400" y2="150"/>
    <line x1="0" y1="200" x2="400" y2="200"/>
    <line x1="0" y1="250" x2="400" y2="250"/>
    <line x1="80" y1="0" x2="80" y2="300"/>
    <line x1="160" y1="0" x2="160" y2="300"/>
    <line x1="240" y1="0" x2="240" y2="300"/>
    <line x1="320" y1="0" x2="320" y2="300"/>
  </g>
  <polygon points="0,0 130,0 105,36 0,36" fill="url(#accent)"/>
  <text x="16" y="23" fill="#ffffff" font-family="monospace, sans-serif" font-weight="900" font-size="15" letter-spacing="2">${grade}</text>
  <rect x="300" y="10" width="86" height="22" rx="4" fill="#1e293b" stroke="${accentColor}" stroke-width="1"/>
  <text x="343" y="25" fill="#94a3b8" font-family="monospace" font-size="10" text-anchor="middle">${code}</text>
  <g transform="translate(200, 130)">
    <polygon points="0,-55 -48,-18 -20,38 20,38 48,-18" fill="#1e293b" stroke="#475569" stroke-width="2"/>
    <polygon points="0,-18 -85,-62 -72,-70 0,-32 72,-70 85,-62" fill="#facc15" stroke="#eab308" stroke-width="1.5"/>
    <polygon points="0,-38 -10,-16 0,-8 10,-16" fill="${accentColor}"/>
    <polygon points="-32,-8 -10,-4 -12,4 -34,0" fill="#22d3ee"/>
    <polygon points="32,-8 10,-4 12,4 34,0" fill="#22d3ee"/>
    <polygon points="-16,8 16,8 12,32 0,38 -12,32" fill="#f8fafc"/>
    <line x1="-8" y1="16" x2="8" y2="16" stroke="${accentColor}" stroke-width="2.5"/>
    <line x1="-6" y1="23" x2="6" y2="23" stroke="${accentColor}" stroke-width="2.5"/>
  </g>
  <rect x="16" y="230" width="368" height="54" rx="8" fill="#0f172a" fill-opacity="0.88" stroke="#334155" stroke-width="1"/>
  <rect x="16" y="230" width="6" height="54" rx="2" fill="url(#accent)"/>
  <text x="32" y="254" fill="#f8fafc" font-family="sans-serif" font-weight="700" font-size="15">${title}</text>
  <text x="32" y="273" fill="#94a3b8" font-family="monospace" font-size="11">AUTHENTIC GUNPLA MODEL KIT • BANDAI SPIRITS</text>
</svg>`;
}

async function seed() {
  console.log("🌱 Seeding POS Gundam Database...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pos_gundam",
  });

  const imgDir = path.join(process.cwd(), "public", "images", "gundam");
  fs.mkdirSync(imgDir, { recursive: true });

  const svgPresets = [
    { file: "rx78.svg", title: "RX-78-2 Gundam Beyond Global", grade: "HG 1/144", code: "GND-0001", c1: "#2563eb", c2: "#ef4444" },
    { file: "aerial.svg", title: "XVX-016 Gundam Aerial Rebuild", grade: "HG 1/144", code: "GND-0002", c1: "#0284c7", c2: "#38bdf8" },
    { file: "sazabi.svg", title: "MSN-04FF Sazabi Ver.Ka", grade: "RG 1/144", code: "GND-0003", c1: "#dc2626", c2: "#991b1b" },
    { file: "nu.svg", title: "RX-93 Nu Gundam Ver.Ka", grade: "MG 1/100", code: "GND-0004", c1: "#1e293b", c2: "#f59e0b" },
    { file: "barbatos.svg", title: "ASW-G-08 Gundam Barbatos Lupus Rex", grade: "MG 1/100", code: "GND-0005", c1: "#3b82f6", c2: "#eab308" },
    { file: "freedom.svg", title: "ZGMF-X20A Strike Freedom Gundam MGEX", grade: "MGEX 1/100", code: "GND-0006", c1: "#ca8a04", c2: "#1d4ed8" },
    { file: "unicorn.svg", title: "RX-0 Unicorn Gundam Unleashed", grade: "PG 1/60", code: "GND-0007", c1: "#e11d48", c2: "#f43f5e" },
    { file: "wingzero.svg", title: "XXXG-00W0 Wing Gundam Zero EW", grade: "MG 1/100", code: "GND-0008", c1: "#2563eb", c2: "#60a5fa" },
    { file: "calibarn.svg", title: "X-EX01 Gundam Calibarn", grade: "HG 1/144", code: "GND-0009", c1: "#6366f1", c2: "#ec4899" },
    { file: "godgundam.svg", title: "GF13-017NJII God Gundam", grade: "RG 1/144", code: "GND-0010", c1: "#ea580c", c2: "#2563eb" },
    { file: "nipper.svg", title: "GodHand SPN-120 Ultimate Nipper", grade: "TOOL PRO", code: "GND-0011", c1: "#0d9488", c2: "#14b8a6" },
    { file: "marker.svg", title: "Gundam Marker EX Metallic Set", grade: "PAINT SET", code: "GND-0012", c1: "#7c3aed", c2: "#a855f7" },
  ];

  for (const s of svgPresets) {
    fs.writeFileSync(
      path.join(imgDir, s.file),
      generateGunplaSvg(s.title, s.grade, s.code, s.c1, s.c2),
      "utf8"
    );
  }

  fs.writeFileSync(
    path.join(imgDir, "logo.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <rect width="120" height="120" rx="24" fill="#0f172a"/>
      <polygon points="60,22 15,8 22,22 60,42 98,22 105,8" fill="#facc15"/>
      <polygon points="60,12 48,30 60,38 72,30" fill="#ef4444"/>
      <polygon points="30,45 90,45 82,95 60,108 38,95" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
      <polygon points="38,56 54,60 52,66 36,62" fill="#22d3ee"/>
      <polygon points="82,56 66,60 68,66 84,62" fill="#22d3ee"/>
      <polygon points="48,74 72,74 68,94 60,99 52,94" fill="#f8fafc"/>
    </svg>`,
    "utf8"
  );

  const [existingBranches]: any = await connection.query("SELECT COUNT(*) as cnt FROM branches");
  if (existingBranches[0].cnt > 0) {
    console.log("ℹ️ Database already has data. Skipping initial seed.");
    await connection.end();
    return;
  }

  // 1. Insert Branches
  await connection.query(`
    INSERT INTO branches (id, id_cabang, code, name, address, phone, is_main) VALUES
    (1, 1, 'BR-KL01', 'Gundam Base Kuala Lumpur HQ', 'Level 4, Lot 4-12, Bukit Bintang Plaza, 55100 Kuala Lumpur, Malaysia', '+60 3-2148 8899', 1),
    (2, 2, 'BR-PG02', 'Gundam Base Penang Queensbay', '2F-88, Queensbay Mall, 100 Persiaran Bayan Indah, 11900 Bayan Lepas, Penang', '+60 4-641 5522', 0),
    (3, 3, 'BR-JB03', 'Gundam Base Johor Bahru Southkey', 'LG-045, The Mall, Mid Valley Southkey, 80150 Johor Bahru, Johor', '+60 7-338 9911', 0)
  `);

  // 2. Insert Users
  const adminPass = await bcrypt.hash("admin123", 10);
  const cashierPass = await bcrypt.hash("cashier123", 10);
  const stockPass = await bcrypt.hash("stock123", 10);

  await connection.query(
    `INSERT INTO users (id, id_cabang, username, password, name, email, phone, role) VALUES
    (1, 1, 'admin', ?, 'Amuro Ray (HQ Admin)', 'amuro.admin@gundambase.my', '+60 12-345 6789', 'admin'),
    (2, 1, 'cashier', ?, 'Suletta Mercury (KL Cashier)', 'suletta.kl@gundambase.my', '+60 17-889 1122', 'employee'),
    (3, 1, 'kira', ?, 'Kira Yamato (KL Senior Cashier)', 'kira.kl@gundambase.my', '+60 19-223 4455', 'employee'),
    (4, 2, 'char', ?, 'Char Aznable (Penang Branch Admin)', 'char.pg@gundambase.my', '+60 16-777 8888', 'admin'),
    (5, 2, 'mikazuki', ?, 'Mikazuki Augus (Penang Cashier)', 'mika.pg@gundambase.my', '+60 11-556 7788', 'employee'),
    (6, 1, 'stockadmin', ?, 'Haro Stock Admin (KL Catalog)', 'stock@gundambase.my', '+60 12-888 9999', 'admin_stok')`,
    [adminPass, cashierPass, cashierPass, adminPass, cashierPass, stockPass]
  );

  // 3. Insert Customers (with id_cabang and soft-delete support)
  await connection.query(`
    INSERT INTO customers (id, id_cabang, name, phone, address) VALUES
    (1, 1, 'Hathaway Noa', '+60 12-901 2233', 'Mont Kiara Residences, 50480 Kuala Lumpur'),
    (2, 1, 'Miorine Rembran', '+60 17-445 8890', 'Bangsar South Tower B, 59200 Kuala Lumpur'),
    (3, 1, 'Setsuna F. Seiei', '+60 19-882 3311', 'SS15 Subang Jaya, 47500 Selangor'),
    (4, 1, 'Kamille Bidan', '+60 13-667 9900', 'Damansara Uptown, 47400 Petaling Jaya'),
    (5, 1, 'Heero Yuy', '+60 18-221 7744', 'KLCC Twin Tower Suites, 50088 Kuala Lumpur'),
    (6, 2, 'Orga Itsuka', '+60 16-441 0099', 'Gurney Drive Condo, 10250 George Town, Penang')
  `);

  // 4. Website Settings
  const secondaryBanksJson = JSON.stringify([
    {
      bankName: "CIMB Bank Berhad",
      accountNumber: "8009876543",
      accountHolder: "GUNDAM BASE MALAYSIA SDN BHD",
    },
    {
      bankName: "Public Bank Berhad",
      accountNumber: "3199887766",
      accountHolder: "GUNDAM BASE MALAYSIA SDN BHD",
    },
  ]);

  await connection.query(
    `INSERT INTO website_settings (id_cabang, site_name, logo_url, address, phone, email, bank_name, bank_account_number, bank_account_holder, secondary_banks, receipt_footer) VALUES
    (1, 'GUNDAM BASE KUALA LUMPUR HQ', '/images/gundam/logo.svg', 'Level 4, Lot 4-12, Bukit Bintang Plaza, 55100 Kuala Lumpur, Malaysia', '+60 3-2148 8899', 'kl-hq@gundambase.my', 'Maybank (Malayan Banking Berhad)', '514012349988', 'GUNDAM BASE MALAYSIA SDN BHD', ?, 'Thank you for shopping at Gundam Base KL! Gunpla is Freedom.'),
    (2, 'GUNDAM BASE PENANG QUEENSBAY', '/images/gundam/logo.svg', '2F-88, Queensbay Mall, 11900 Bayan Lepas, Penang, Malaysia', '+60 4-641 5522', 'penang@gundambase.my', 'Maybank (Malayan Banking Berhad)', '514012349988', 'GUNDAM BASE MALAYSIA SDN BHD', ?, 'Thank you for shopping at Gundam Base Penang! Keep Building.'),
    (3, 'GUNDAM BASE JOHOR BAHRU', '/images/gundam/logo.svg', 'LG-045, Mid Valley Southkey, 80150 Johor Bahru, Johor, Malaysia', '+60 7-338 9911', 'jb@gundambase.my', 'Maybank (Malayan Banking Berhad)', '514012349988', 'GUNDAM BASE MALAYSIA SDN BHD', ?, 'Thank you for shopping at Gundam Base JB!')`,
    [secondaryBanksJson, secondaryBanksJson, secondaryBanksJson]
  );

  // 5. Categories
  await connection.query(`
    INSERT INTO categories (id, id_cabang, code, name, description) VALUES
    (1, 1, 'CAT-GUNPLA', 'Gunpla Model Kits', 'Official Bandai Spirits Plastic Model Kits across all scales and grades'),
    (2, 1, 'CAT-TOOLS', 'Hobby Tools & Supplies', 'Nippers, sanding sticks, panel liners, and modeling equipment'),
    (3, 1, 'CAT-PAINTS', 'Paints, Markers & Topcoat', 'Gundam Markers, lacquer/acrylic paints, and Mr. Super Clear topcoats'),
    (4, 1, 'CAT-BASE', 'Action Bases & LED Units', 'Display stands, hangar bases, and LED lighting units for Gunpla'),
    (5, 2, 'CAT-GUNPLA-PG', 'Gunpla Model Kits', 'Official Bandai Spirits Plastic Model Kits - Penang Branch'),
    (6, 2, 'CAT-TOOLS-PG', 'Hobby Tools & Supplies', 'Modeling tools and accessories - Penang Branch')
  `);

  // 6. Sub Categories
  await connection.query(`
    INSERT INTO sub_categories (id, id_cabang, category_id, name, description) VALUES
    (1, 1, 1, 'HG (High Grade 1/144)', '1/144 scale kits with wide mobile suit selection and easy assembly'),
    (2, 1, 1, 'RG (Real Grade 1/144)', '1/144 scale kits with inner frame detail and realistic decals'),
    (3, 1, 1, 'MG (Master Grade 1/100)', '1/100 scale highly articulated kits with full mechanical inner frame'),
    (4, 1, 1, 'PG (Perfect Grade 1/60)', 'Flagship 1/60 scale ultimate gunpla engineering experience'),
    (5, 1, 2, 'Precision Nippers & Blades', 'Single-blade and double-blade hobby cutters'),
    (6, 1, 3, 'Gundam Markers & Panel Liners', 'Fine tip panel lining pens and metallic markers'),
    (7, 1, 4, 'Action Base 1/100 & 1/144', 'Adjustable aerial pose stands'),
    (8, 2, 5, 'HG (High Grade 1/144)', '1/144 scale High Grade kits'),
    (9, 2, 5, 'MG (Master Grade 1/100)', '1/100 scale Master Grade kits'),
    (10, 2, 6, 'Precision Nippers & Blades', 'Professional hobby nippers')
  `);

  // 7. Brands
  await connection.query(`
    INSERT INTO brands (id, id_cabang, name, description) VALUES
    (1, 1, 'Bandai Spirits (Blue Logo)', 'Official manufacturer of Gundam Plastic Models (Gunpla)'),
    (2, 1, 'Mr. Hobby (GSI Creos)', 'Premier hobby paints, markers, cement, and finishing sprays'),
    (3, 1, 'GodHand', 'Craftsman-grade precision nippers and modeling tools'),
    (4, 1, 'Tamiya', 'World-renowned modeling tools, panel line accent colors, and cement'),
    (5, 2, 'Bandai Spirits (Blue Logo)', 'Official manufacturer of Gundam Plastic Models'),
    (6, 2, 'Mr. Hobby (GSI Creos)', 'Hobby paints and markers')
  `);

  // 8. Products
  await connection.query(`
    INSERT INTO products (id, id_cabang, product_code, name, image, category_id, sub_category_id, brand_id, stock, price) VALUES
    (1, 1, '4573102600011', 'HG 1/144 RX-78-2 Gundam [Beyond Global]', '/images/gundam/rx78.svg', 1, 1, 1, 42, 89.00),
    (2, 1, '4573102650924', 'HG 1/144 XVX-016 Gundam Aerial Rebuild', '/images/gundam/aerial.svg', 1, 1, 1, 35, 78.50),
    (3, 1, '4573102551238', 'RG 1/144 MSN-04 Sazabi [Special Coating]', '/images/gundam/sazabi.svg', 1, 2, 1, 18, 215.00),
    (4, 1, '4573102554567', 'MG 1/100 RX-93 Nu Gundam Ver.Ka', '/images/gundam/nu.svg', 1, 3, 1, 14, 329.00),
    (5, 1, '4573102582218', 'MG 1/100 ASW-G-08 Gundam Barbatos', '/images/gundam/barbatos.svg', 1, 3, 1, 26, 219.00),
    (6, 1, '4573102633682', 'MGEX 1/100 Strike Freedom Gundam', '/images/gundam/freedom.svg', 1, 3, 1, 8, 695.00),
    (7, 1, '4573102607652', 'PG Unleashed 1/60 RX-78-2 / Unicorn Gundam', '/images/gundam/unicorn.svg', 1, 4, 1, 5, 1180.00),
    (8, 1, '4573102607607', 'MG 1/100 Wing Gundam Zero EW Ver.Ka', '/images/gundam/wingzero.svg', 1, 3, 1, 20, 259.00),
    (9, 1, '4573102657022', 'HG 1/144 X-EX01 Gundam Calibarn', '/images/gundam/calibarn.svg', 1, 1, 1, 50, 88.00),
    (10, 1, '4573102630421', 'RG 1/144 GF13-017NJII God Gundam', '/images/gundam/godgundam.svg', 1, 2, 1, 29, 165.00),
    (11, 1, '4562349871209', 'GodHand SPN-120 Ultimate Nipper 5.0', '/images/gundam/nipper.svg', 2, 5, 3, 15, 245.00),
    (12, 1, '4973028512342', 'Gundam Marker EX Metallic Set (6 Pens)', '/images/gundam/marker.svg', 3, 6, 2, 60, 72.00),
    (13, 2, '4573102600011', 'HG 1/144 RX-78-2 Gundam [Beyond Global]', '/images/gundam/rx78.svg', 5, 8, 5, 25, 89.00),
    (14, 2, '4573102582218', 'MG 1/100 ASW-G-08 Gundam Barbatos', '/images/gundam/barbatos.svg', 5, 9, 5, 12, 219.00),
    (15, 2, '4562349871209', 'GodHand SPN-120 Ultimate Nipper 5.0', '/images/gundam/nipper.svg', 6, 10, 5, 9, 245.00)
  `);

  // Soft-deleted sample in Trash
  await connection.query(`
    INSERT INTO products (id, id_cabang, product_code, name, image, category_id, sub_category_id, brand_id, stock, price, deleted_at, deleted_by) VALUES
    (16, 1, '4573102999991', 'HG 1/144 Zaku II Red Comet [Discontinued Sample]', '/images/gundam/sazabi.svg', 1, 1, 1, 7, 79.00, NOW(), 1)
  `);

  // 9. Stock Ins
  await connection.query(`
    INSERT INTO stock_ins (id, id_cabang, reference_no, product_id, qty, previous_stock, new_stock, supplier, note, user_id, created_at) VALUES
    (1, 1, 'STK-202611-001', 1, 20, 22, 42, 'Bandai Namco Asia Distributor', 'Monthly restock batch A', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (2, 1, 'STK-202611-002', 9, 30, 20, 50, 'Bandai Namco Asia Distributor', 'WFM Calibarn restock', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (3, 1, 'STK-202611-003', 11, 10, 5, 15, 'HobbyTools Japan Import', 'GodHand SPN-120 air freight', 1, DATE_SUB(NOW(), INTERVAL 1 DAY))
  `);

  // 10. Sample Transactions linked with Customers
  await connection.query(`
    INSERT INTO transactions (id, id_cabang, invoice_no, user_id, customer_id, customer_name, customer_phone, gross_total, discount_total, net_total, payment_method, cash_amount, transfer_amount, bank_account_info, change_amount, notes, created_at) VALUES
    (1, 1, 'INV-KL-20261116-0001', 2, 1, 'Hathaway Noa', '+60 12-901 2233', 418.00, 18.00, 400.00, 'cash', 450.00, 0.00, NULL, 50.00, 'Member discount applied', NOW()),
    (2, 1, 'INV-KL-20261116-0002', 2, 2, 'Miorine Rembran', '+60 17-445 8890', 695.00, 25.00, 670.00, 'qr_pay', 0.00, 670.00, 'Maybank - 514012349988', 0.00, 'DuitNow QR Pay received', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (3, 1, 'INV-KL-20261115-0003', 3, 3, 'Setsuna F. Seiei', '+60 19-882 3311', 493.50, 13.50, 480.00, 'transfer', 0.00, 480.00, 'Maybank - 514012349988', 0.00, 'Instant DuitNow transfer verified', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (4, 1, 'INV-KL-20261113-0004', 2, 4, 'Kamille Bidan', '+60 13-667 9900', 1425.00, 45.00, 1380.00, 'transfer', 0.00, 1380.00, 'Maybank - 514012349988', 0.00, 'VIP Collector bundle', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (5, 1, 'INV-KL-20261105-0005', 3, 5, 'Heero Yuy', '+60 18-221 7744', 518.00, 0.00, 518.00, 'cash', 520.00, 0.00, NULL, 2.00, 'Standard walk-in purchase', DATE_SUB(NOW(), INTERVAL 10 DAY)),
    (6, 2, 'INV-PG-20261116-0001', 5, 6, 'Orga Itsuka', '+60 16-441 0099', 308.00, 8.00, 300.00, 'cash', 300.00, 0.00, NULL, 0.00, 'Penang branch sale', NOW())
  `);

  // 11. Sample Transaction Items
  await connection.query(`
    INSERT INTO transaction_items (id_cabang, transaction_id, product_id, product_code, product_name, original_price, custom_price, qty, discount_amount, gross_subtotal, net_subtotal) VALUES
    (1, 1, 1, '4573102600011', 'HG 1/144 RX-78-2 Gundam [Beyond Global]', 89.00, 89.00, 1, 8.00, 89.00, 81.00),
    (1, 1, 4, '4573102554567', 'MG 1/100 RX-93 Nu Gundam Ver.Ka', 329.00, 329.00, 1, 10.00, 329.00, 319.00),
    (1, 2, 6, '4573102633682', 'MGEX 1/100 Strike Freedom Gundam', 695.00, 695.00, 1, 25.00, 695.00, 670.00),
    (1, 3, 2, '4573102650924', 'HG 1/144 XVX-016 Gundam Aerial Rebuild', 78.50, 78.50, 1, 3.50, 78.50, 75.00),
    (1, 3, 3, '4573102551238', 'RG 1/144 MSN-04 Sazabi [Special Coating]', 215.00, 215.00, 1, 10.00, 215.00, 205.00),
    (1, 3, 10, '4573102630421', 'RG 1/144 GF13-017NJII God Gundam', 165.00, 200.00, 1, 0.00, 200.00, 200.00),
    (1, 4, 7, '4573102607652', 'PG Unleashed 1/60 RX-78-2 / Unicorn Gundam', 1180.00, 1180.00, 1, 30.00, 1180.00, 1150.00),
    (1, 4, 11, '4562349871209', 'GodHand SPN-120 Ultimate Nipper 5.0', 245.00, 245.00, 1, 15.00, 245.00, 230.00),
    (1, 5, 8, '4573102607607', 'MG 1/100 Wing Gundam Zero EW Ver.Ka', 259.00, 259.00, 2, 0.00, 518.00, 518.00),
    (2, 6, 13, '4573102600011', 'HG 1/144 RX-78-2 Gundam [Beyond Global]', 89.00, 89.00, 1, 8.00, 89.00, 81.00),
    (2, 6, 14, '4573102582218', 'MG 1/100 ASW-G-08 Gundam Barbatos', 219.00, 219.00, 1, 0.00, 219.00, 219.00)
  `);

  // 12. Sample Activity Logs
  await connection.query(`
    INSERT INTO activity_logs (id_cabang, user_id, user_name, user_role, module, action, target_id, description, metadata, ip_address, created_at) VALUES
    (1, 1, 'Amuro Ray (HQ Admin)', 'admin', 'System', 'INIT', 1, 'Initialized Gundam Base POS system and multi-branch master catalog', '{"branch":"BR-KL01"}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 3 DAY)),
    (1, 1, 'Amuro Ray (HQ Admin)', 'admin', 'Stock In', 'STOCK_IN', 2, 'Added +30 stock to HG 1/144 X-EX01 Gundam Calibarn (20 -> 50)', '{"productId":9,"qty":30,"prev":20,"next":50}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 DAY)),
    (1, 3, 'Kira Yamato (KL Senior Cashier)', 'employee', 'POS', 'PRICE_OVERRIDE', 3, 'Modified unit price in POS for RG 1/144 GF13-017NJII God Gundam from RM 165.00 to RM 200.00 on Invoice INV-KL-20261115-0003', '{"invoice":"INV-KL-20261115-0003","product":"RG 1/144 GF13-017NJII God Gundam","originalPrice":165,"customPrice":200}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
    (1, 2, 'Suletta Mercury (KL Cashier)', 'employee', 'POS', 'POS_CHECKOUT', 2, 'Completed QR Pay transaction INV-KL-20261116-0002 for customer Miorine Rembran (Net: RM 670.00 | DuitNow QR)', '{"invoice":"INV-KL-20261116-0002","netTotal":670,"paymentMethod":"qr_pay"}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
    (1, 1, 'Amuro Ray (HQ Admin)', 'admin', 'Products', 'SOFT_DELETE', 16, 'Soft-deleted product HG 1/144 Zaku II Red Comet [Discontinued Sample] (Code: 4573102999991)', '{"productId":16,"code":"4573102999991"}', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 HOUR))
  `);

  console.log("✅ Seed completed! Default accounts:");
  console.log("   Admin:    username = admin   | password = admin123");
  console.log("   Cashier:  username = cashier | password = cashier123");
  await connection.end();
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
