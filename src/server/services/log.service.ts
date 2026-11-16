import { pool } from "@/db";
import { SessionUser } from "@/lib/auth";

export class LogService {
  static async record(params: {
    idCabang: number;
    user?: SessionUser | null;
    module: string;
    action: string;
    targetId?: number | null;
    description: string;
    metadata?: Record<string, unknown> | null;
    ipAddress?: string;
  }) {
    try {
      await pool.query(
        `INSERT INTO activity_logs (id_cabang, user_id, user_name, user_role, module, action, target_id, description, metadata, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          params.idCabang || 1,
          params.user?.id ?? null,
          params.user?.name ?? "System",
          params.user?.role ?? "system",
          params.module,
          params.action,
          params.targetId ?? null,
          params.description,
          params.metadata ? JSON.stringify(params.metadata) : null,
          params.ipAddress || "127.0.0.1",
        ]
      );
    } catch (error) {
      console.error("Failed to write activity log:", error);
    }
  }

  static async list(idCabang: number, limit = 500) {
    const [rows] = await pool.query(
      `SELECT l.*, b.name as branch_name
       FROM activity_logs l
       LEFT JOIN branches b ON l.id_cabang = b.id
       WHERE l.deleted_at IS NULL AND (? = 0 OR l.id_cabang = ?)
       ORDER BY l.created_at DESC, l.id DESC
       LIMIT ?`,
      [idCabang, idCabang, limit]
    );
    return rows;
  }
}
