import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log("🚀 Running MySQL Database Migrations for POS Gundam...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || "pos_gundam";
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
  );
  await connection.query(`USE \`${dbName}\`;`);

  const migrationPath = path.join(
    process.cwd(),
    "drizzle",
    "migrations",
    "0000_initial_schema.sql"
  );
  const sqlContent = fs.readFileSync(migrationPath, "utf8");

  await connection.query(sqlContent);
  console.log("✅ Database schema migrated successfully!");
  await connection.end();
}

runMigrations().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
