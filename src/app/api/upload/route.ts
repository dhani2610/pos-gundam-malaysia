import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".png";
    const safeName = `img-${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
