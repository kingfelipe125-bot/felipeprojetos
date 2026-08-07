import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";

// Em produção (Vercel), usa Vercel Blob — o filesystem do Vercel é somente
// leitura fora de /tmp, então local disk não persiste entre requisições.
// Sem BLOB_READ_WRITE_TOKEN (dev local), grava em public/uploads.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUploadedFile(file: File) {
  const ext = path.extname(file.name) || "";
  const safeName = `${nanoid(12)}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safeName, file, { access: "public" });
    return { fileName: file.name, fileUrl: blob.url, fileSize: file.size };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/uploads/${safeName}`,
    fileSize: buffer.byteLength,
  };
}
