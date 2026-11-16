import { pool } from "@/db";
import bcrypt from "bcryptjs";
import { LoginRequestDto, UpdateProfileDto } from "../dtos/auth.dto";
import { SessionUser, signSessionToken } from "@/lib/auth";
import { LogService } from "./log.service";

export class AuthService {
  static async login(dto: LoginRequestDto) {
    const [rows]: any = await pool.query(
      `SELECT u.*, b.name as branch_name
       FROM users u
       LEFT JOIN branches b ON u.id_cabang = b.id
       WHERE u.username = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [dto.username.trim()]
    );

    const user = rows[0];
    if (!user) {
      throw new Error("Invalid username or password");
    }

    const valid = await bcrypt.compare(dto.password || "", user.password);
    if (!valid) {
      throw new Error("Invalid username or password");
    }

    const normalizedRole =
      user.role === "admin"
        ? "admin"
        : user.role === "admin_stok"
          ? "admin_stok"
          : "employee";

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: normalizedRole,
      idCabang: user.id_cabang,
    };

    const token = await signSessionToken(sessionUser);

    await LogService.record({
      idCabang: user.id_cabang,
      user: sessionUser,
      module: "Authentication",
      action: "LOGIN",
      targetId: user.id,
      description: `User ${user.name} (@${user.username}) logged in as ${user.role.toUpperCase()}`,
    });

    return { user: sessionUser, token, branchName: user.branch_name };
  }

  static async getProfile(userId: number) {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.id_cabang as idCabang, u.username, u.name, u.email, u.phone, u.role, u.created_at as createdAt, b.name as branchName
       FROM users u
       LEFT JOIN branches b ON u.id_cabang = b.id
       WHERE u.id = ? AND u.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async updateProfile(sessionUser: SessionUser, dto: UpdateProfileDto) {
    const [existing]: any = await pool.query(
      `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [sessionUser.id]
    );
    if (!existing[0]) throw new Error("User not found");

    // Check username uniqueness
    const [dup]: any = await pool.query(
      `SELECT id FROM users WHERE username = ? AND id != ? AND deleted_at IS NULL LIMIT 1`,
      [dto.username.trim(), sessionUser.id]
    );
    if (dup.length > 0) {
      throw new Error("Username is already taken by another user");
    }

    let newPasswordHash = existing[0].password;
    if (dto.newPassword && dto.newPassword.trim().length > 0) {
      if (dto.currentPassword) {
        const isMatch = await bcrypt.compare(
          dto.currentPassword,
          existing[0].password
        );
        if (!isMatch) {
          throw new Error("Current password is incorrect");
        }
      }
      newPasswordHash = await bcrypt.hash(dto.newPassword.trim(), 10);
    }

    await pool.query(
      `UPDATE users SET name = ?, username = ?, email = ?, phone = ?, password = ?, updated_at = NOW() WHERE id = ?`,
      [
        dto.name.trim(),
        dto.username.trim(),
        dto.email.trim(),
        dto.phone.trim(),
        newPasswordHash,
        sessionUser.id,
      ]
    );

    const updatedSession: SessionUser = {
      ...sessionUser,
      name: dto.name.trim(),
      username: dto.username.trim(),
      email: dto.email.trim(),
      phone: dto.phone.trim(),
    };

    const token = await signSessionToken(updatedSession);

    await LogService.record({
      idCabang: sessionUser.idCabang,
      user: updatedSession,
      module: "Profile",
      action: "UPDATE",
      targetId: sessionUser.id,
      description: `User ${updatedSession.name} updated their profile details${dto.newPassword ? " and changed password" : ""}`,
    });

    return { user: updatedSession, token };
  }
}
