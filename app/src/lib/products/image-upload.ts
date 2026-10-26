// Shared browser/server policy. This module contains no credentials or SDK imports.
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageUploadCode =
  "imageType" | "imageSize" | "imageInvalid" | "uploadBody" | "uploadUnavailable" | "uploadFailed";

export class ImageUploadError extends Error {
  code: ImageUploadCode;
  status: number;
  constructor(code: ImageUploadCode, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function validateProductImageFile(file: Pick<File, "size" | "type">) {
  if (!PRODUCT_IMAGE_TYPES.some((type) => type === file.type))
    throw new ImageUploadError("imageType", 415);
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) throw new ImageUploadError("imageSize", 413);
  if (file.size === 0) throw new ImageUploadError("imageInvalid");
}
