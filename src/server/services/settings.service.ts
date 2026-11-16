import { pool } from "@/db";
import { WebsiteSettingsDto } from "../dtos/settings.dto";
import { SessionUser } from "@/lib/auth";
import { LogService } from "./log.service";

export class SettingsService {
  static async getSettings(idCabang: number) {
    const [rows]: any = await pool.query(
      `SELECT id, id_cabang as idCabang, site_name as siteName, logo_url as logoUrl,
              address, phone, email, bank_name as bankName,
              bank_account_number as bankAccountNumber, bank_account_holder as bankAccountHolder,
              secondary_banks as secondaryBanks, receipt_footer as receiptFooter
       FROM website_settings
       WHERE id_cabang = ? AND deleted_at IS NULL
       LIMIT 1`,
      [idCabang || 1]
    );

    if (!rows[0]) {
      // Fallback to HQ branch settings
      const [hqRows]: any = await pool.query(
        `SELECT id, id_cabang as idCabang, site_name as siteName, logo_url as logoUrl,
                address, phone, email, bank_name as bankName,
                bank_account_number as bankAccountNumber, bank_account_holder as bankAccountHolder,
                secondary_banks as secondaryBanks, receipt_footer as receiptFooter
         FROM website_settings
         WHERE deleted_at IS NULL
         ORDER BY id ASC LIMIT 1`
      );
      if (!hqRows[0]) return null;
      return this.parseRow(hqRows[0]);
    }

    return this.parseRow(rows[0]);
  }

  private static parseRow(row: any) {
    let secondaryBanks = [];
    try {
      if (row.secondaryBanks) {
        secondaryBanks = JSON.parse(row.secondaryBanks);
      }
    } catch {
      secondaryBanks = [];
    }
    return {
      ...row,
      secondaryBanks,
    };
  }

  static async updateSettings(dto: WebsiteSettingsDto, actor: SessionUser) {
    const [existing]: any = await pool.query(
      `SELECT id FROM website_settings WHERE id_cabang = ? AND deleted_at IS NULL LIMIT 1`,
      [dto.idCabang]
    );

    const secondaryBanksStr = JSON.stringify(dto.secondaryBanks || []);

    if (existing[0]) {
      await pool.query(
        `UPDATE website_settings
         SET site_name = ?, logo_url = ?, address = ?, phone = ?, email = ?,
             bank_name = ?, bank_account_number = ?, bank_account_holder = ?,
             secondary_banks = ?, receipt_footer = ?, updated_at = NOW()
         WHERE id = ?`,
        [
          dto.siteName.trim(),
          dto.logoUrl || "/images/gundam/logo.svg",
          dto.address || "",
          dto.phone || "",
          dto.email || "",
          dto.bankName || "",
          dto.bankAccountNumber || "",
          dto.bankAccountHolder || "",
          secondaryBanksStr,
          dto.receiptFooter || "",
          existing[0].id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO website_settings
         (id_cabang, site_name, logo_url, address, phone, email, bank_name, bank_account_number, bank_account_holder, secondary_banks, receipt_footer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.idCabang,
          dto.siteName.trim(),
          dto.logoUrl || "/images/gundam/logo.svg",
          dto.address || "",
          dto.phone || "",
          dto.email || "",
          dto.bankName || "",
          dto.bankAccountNumber || "",
          dto.bankAccountHolder || "",
          secondaryBanksStr,
          dto.receiptFooter || "",
        ]
      );
    }

    await LogService.record({
      idCabang: dto.idCabang,
      user: actor,
      module: "Website Settings",
      action: "UPDATE",
      targetId: dto.idCabang,
      description: `Updated store & bank payment settings for "${dto.siteName}" (Primary Bank: ${dto.bankName} - ${dto.bankAccountNumber})`,
      metadata: { ...dto },
    });

    return await this.getSettings(dto.idCabang);
  }
}
