import type { ImageUploadCode } from "./image-upload";

export type ProductErrorCode =
  | ImageUploadCode
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "duplicateSlug"
  | "orders"
  | "conflict"
  | "invalid"
  | "category"
  | "network"
  | "server"
  | "busy";

export class ProductRequestError extends Error {
  code: ProductErrorCode;
  constructor(code: ProductErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function productRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...options });
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new ProductRequestError("network");
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : "";
    const uploadCode =
      data &&
      typeof data === "object" &&
      "code" in data &&
      [
        "imageType",
        "imageSize",
        "imageInvalid",
        "uploadBody",
        "uploadUnavailable",
        "uploadFailed",
      ].includes(String(data.code))
        ? (data.code as ImageUploadCode)
        : undefined;
    const code: ProductErrorCode =
      uploadCode ??
      (response.status === 401
        ? "unauthorized"
        : response.status === 403
          ? "forbidden"
          : response.status === 404
            ? "notFound"
            : response.status === 409
              ? message.includes("slug")
                ? "duplicateSlug"
                : message.includes("orders")
                  ? "orders"
                  : "conflict"
              : response.status === 400
                ? message === "Category not found"
                  ? "category"
                  : "invalid"
                : "server");
    throw new ProductRequestError(code);
  }
  if (!data || typeof data !== "object") throw new ProductRequestError("server");
  return data as T;
}

export function productErrorCode(error: unknown): ProductErrorCode {
  return error instanceof ProductRequestError ? error.code : "server";
}
