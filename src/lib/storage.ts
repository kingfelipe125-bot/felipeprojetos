import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

// Simula um bucket de armazenamento (Supabase Storage / S3) gravando os
// arquivos em public/uploads. Troque por um SDK real de storage em produção
// mantendo a mesma assinatura de retorno { fileUrl, fileName, fileSize }.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function saveUploadedFile(file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeName = `${nanoid(12)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

  return {
    fileName: file.name,
    fileUrl: `/uploads/${safeName}`,
    fileSize: buffer.byteLength,
  };
}
