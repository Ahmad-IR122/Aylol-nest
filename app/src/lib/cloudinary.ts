import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { ImageUploadError } from "@/lib/products/image-upload";
import type { ProductImage } from "@/types/product";

export const PRODUCT_IMAGE_FOLDER = "aylol-nest/products";

export function requireCloudinaryConfig() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) throw new ImageUploadError("uploadUnavailable", 503);
  return { cloud_name, api_key, api_secret, secure: true };
}

export async function uploadProductImage(
  buffer: Buffer,
): Promise<Pick<ProductImage, "url" | "publicId">> {
  const config = requireCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const fail = () => reject(new ImageUploadError("uploadFailed", 502));
    try {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...config,
          resource_type: "image",
          folder: PRODUCT_IMAGE_FOLDER,
          public_id: randomUUID(),
          overwrite: false,
          allowed_formats: ["jpg", "png", "webp"],
          timeout: 60_000,
        },
        (error, result) => {
          if (
            error ||
            !result?.secure_url?.startsWith("https://res.cloudinary.com/") ||
            !result.public_id?.startsWith(`${PRODUCT_IMAGE_FOLDER}/`)
          ) {
            fail();
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.on("error", fail);
      stream.end(buffer);
    } catch {
      fail();
    }
  });
}
