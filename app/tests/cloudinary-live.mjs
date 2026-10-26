// Opt-in real integration check: creates one tiny image, then removes only that
// newly returned asset. Run: node --env-file=.env.local tests/cloudinary-live.mjs
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";

const root = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "check:server-only", shortCircuit: true };
    if (specifier.startsWith("@/"))
      return { url: new URL(`${specifier.slice(2)}.ts`, root).href, shortCircuit: true };
    if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(root.href) &&
      !specifier.endsWith(".ts")
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "check:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    return nextLoad(url, context);
  },
});

const { uploadProductImage, requireCloudinaryConfig } = await import("../src/lib/cloudinary.ts");
let image;
let testProduct;
let productModel;
try {
  const buffer = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#a97872" },
  })
    .png()
    .toBuffer();
  image = await uploadProductImage(buffer);
  console.log("Live Cloudinary upload: passed");
  const response = await fetch(image.url, { signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200);
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(metadata.width, 16);
  assert.equal(metadata.height, 16);
  console.log("HTTPS image retrieval and decoding: passed");
  if (process.argv.includes("--with-mongodb")) {
    const { connectDB } = await import("../src/lib/db/mongoose.ts");
    const { Category } = await import("../src/models/Category.ts");
    const { Product } = await import("../src/models/Product.ts");
    productModel = Product;
    await connectDB();
    const category = await Category.findOne().select("_id").lean();
    assert.ok(category, "The database needs an existing category for this test");
    const nonce = randomUUID();
    testProduct = await Product.create({
      name: { ar: "اختبار رفع صورة", en: "Image upload integration check" },
      slug: `upload-integration-${nonce}`,
      category: category._id,
      gender: "unisex",
      ageGroup: "kids",
      isActive: false,
      images: [{ ...image, alt: { ar: "صورة اختبار", en: "Test image" } }],
      variants: [
        {
          sku: `UPLOAD-TEST-${nonce}`,
          size: "TEST",
          color: { name: { ar: "بيج", en: "Beige" }, hex: "#a97872" },
          stock: 0,
          price: 0,
          isActive: false,
        },
      ],
    });
    const persisted = await Product.findById(testProduct._id).select("images").lean();
    assert.equal(persisted.images[0].url, image.url);
    assert.equal(persisted.images[0].publicId, image.publicId);
    assert.equal(persisted.images[0].alt.en, "Test image");
    console.log("MongoDB metadata persistence and read-back: passed");
  }
} catch (error) {
  console.error("Live check failed:", error?.code ?? error?.name ?? "unknown failure");
  process.exitCode = 1;
} finally {
  let canRemoveImage = true;
  if (testProduct && productModel) {
    try {
      const deleted = await productModel.deleteOne({
        _id: testProduct._id,
        slug: testProduct.slug,
        isActive: false,
      });
      assert.equal(deleted.deletedCount, 1);
      console.log("Cleanup of the newly created inactive test product: passed");
    } catch {
      canRemoveImage = false;
      console.error(
        "Test product cleanup failed; image retained. Review test product:",
        String(testProduct._id),
      );
      process.exitCode = 1;
    }
  }
  if (image && canRemoveImage) {
    try {
      const result = await cloudinary.uploader.destroy(image.publicId, {
        ...requireCloudinaryConfig(),
        resource_type: "image",
        invalidate: true,
        timeout: 20_000,
      });
      assert.equal(result.result, "ok");
      console.log("Cleanup of the newly created test image: passed");
    } catch {
      console.error("Test image cleanup failed. Review this newly created asset:", image.publicId);
      process.exitCode = 1;
    }
  }
  await mongoose.disconnect();
}
