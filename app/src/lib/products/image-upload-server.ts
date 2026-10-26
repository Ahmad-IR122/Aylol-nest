import "server-only";

import sharp from "sharp";
import {
  ImageUploadError,
  MAX_PRODUCT_IMAGE_BYTES,
  validateProductImageFile,
} from "./image-upload";

// Bound the actual streamed body, not only the client-controlled Content-Length.
export const MAX_UPLOAD_BODY_BYTES = MAX_PRODUCT_IMAGE_BYTES + 64 * 1024;
export async function readProductImage(request: Request): Promise<File> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body)
    throw new ImageUploadError("uploadBody");
  const length = Number(request.headers.get("content-length"));
  if (length > MAX_UPLOAD_BODY_BYTES) throw new ImageUploadError("imageSize", 413);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPLOAD_BODY_BYTES) {
        await reader.cancel();
        throw new ImageUploadError("imageSize", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let form: FormData;
  try {
    form = await new Response(body, { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new ImageUploadError("uploadBody");
  }
  const entries = [...form.entries()];
  if (entries.length !== 1 || entries[0][0] !== "file" || !(entries[0][1] instanceof File))
    throw new ImageUploadError("uploadBody");
  const file = entries[0][1];
  validateProductImageFile(file);
  return file;
}

export async function decodeProductImage(file: File): Promise<Buffer> {
  validateProductImageFile(file);
  const input = Buffer.from(await file.arrayBuffer());
  const formats: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  let image: Buffer;
  try {
    const decoder = sharp(input, { failOn: "warning", limitInputPixels: 40_000_000 });
    const metadata = await decoder.metadata();
    if (metadata.format !== formats[file.type] || (metadata.pages ?? 1) > 1)
      throw new Error("Invalid image format");
    // Decode actual pixels, auto-orient, and re-encode without EXIF or appended
    // payloads. A valid header alone does not establish a valid image.
    image = await decoder.rotate().timeout({ seconds: 15 }).toBuffer();
  } catch {
    throw new ImageUploadError("imageInvalid");
  }
  if (image.byteLength > MAX_PRODUCT_IMAGE_BYTES) throw new ImageUploadError("imageSize", 413);
  return image;
}
