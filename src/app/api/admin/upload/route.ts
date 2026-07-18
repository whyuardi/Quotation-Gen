import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// POST /api/admin/upload
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const extension = path.extname(originalName);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${extension}`;

    // 1. If Vercel Blob Token is configured, upload to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log(`Uploading to Vercel Blob: ${uniqueName}`);
      const blob = await put(uniqueName, buffer, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url });
    }

    // 2. Otherwise fallback to local public upload folder for easy offline development
    console.log(`Token missing. Falling back to local upload: ${uniqueName}`);
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    const localUrl = `/uploads/${uniqueName}`;
    return NextResponse.json({ url: localUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
