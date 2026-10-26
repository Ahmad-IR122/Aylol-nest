import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireCloudinaryConfig, uploadProductImage } from "@/lib/cloudinary";
import { productErrorResponse } from "@/lib/products/errors";
import { ImageUploadError } from "@/lib/products/image-upload";
import { decodeProductImage, readProductImage } from "@/lib/products/image-upload-server";

export const runtime = "nodejs";

const messages = {
  imageType: "Only JPEG, PNG and WebP images are supported",
  imageSize: "Images must be no larger than 5 MB",
  imageInvalid: "Invalid image; choose a valid still image under 40 megapixels",
  uploadBody: "Send exactly one image in the multipart file field",
  uploadUnavailable: "Image uploads are not configured",
  uploadFailed: "Image upload failed; please try again",
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ message: "Upload from this site only" }, { status: 403 });
    }
    const file = await readProductImage(request);
    requireCloudinaryConfig();
    const buffer = await decodeProductImage(file);
    const image = await uploadProductImage(buffer);
    return NextResponse.json({ success: true, image }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json(
        { message: messages[error.code], code: error.code },
        { status: error.status },
      );
    }
    return productErrorResponse(error);
  }
}
