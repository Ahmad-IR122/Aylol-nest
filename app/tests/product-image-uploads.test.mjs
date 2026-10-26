import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, mock, test } from "node:test";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

const root = new URL("../src/", import.meta.url);
const authUrl = new URL("lib/auth/require-admin.ts", root).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "test:server-only", shortCircuit: true };
    if (specifier.startsWith("@/"))
      return { url: new URL(`${specifier.slice(2)}.ts`, root).href, shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(root.href) &&
      !specifier.endsWith(".ts")
    )
      return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "test:server-only")
      return { format: "module", source: "export {};", shortCircuit: true };
    if (url === authUrl)
      return {
        format: "module",
        shortCircuit: true,
        source: `
      export class UnauthorizedError extends Error {}
      export class ForbiddenError extends Error {}
      let error;
      export function setError(value) { error = value; }
      export async function requireAdmin() { if (error) throw error; }
    `,
      };
    return nextLoad(url, context);
  },
});
const { POST } = await import("../src/app/api/admin/uploads/products/route.ts");
const auth = await import(authUrl);
const { MAX_PRODUCT_IMAGE_BYTES, validateProductImageFile } =
  await import("../src/lib/products/image-upload.ts");
const { MAX_UPLOAD_BODY_BYTES, readProductImage, decodeProductImage } =
  await import("../src/lib/products/image-upload-server.ts");
const { createProductSchema } = await import("../src/lib/products/validation.ts");
const { Product } = await import("../src/models/Product.ts");
const envNames = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const originalEnv = Object.fromEntries(envNames.map((key) => [key, process.env[key]]));
beforeEach(() => {
  envNames.forEach((key) => {
    process.env[key] = "upload-test";
  });
  auth.setError(undefined);
});
afterEach(() => {
  mock.restoreAll();
  envNames.forEach((key) => {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  });
});
async function fixture(format = "png") {
  return sharp({ create: { width: 3, height: 2, channels: 3, background: "pink" } })
    .toFormat(format)
    .toBuffer();
}
function request(file, extras = false) {
  const body = new FormData();
  body.append("file", file);
  if (extras) body.append("publicId", "someone-elses-image");
  return new Request("https://store.test/api/admin/uploads/products", { method: "POST", body });
}
function fakeCloudinary(inspect = () => {}) {
  return mock.method(cloudinary.uploader, "upload_stream", (options, callback) => {
    const chunks = [];
    const stream = new PassThrough();
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("finish", () => {
      inspect(options, Buffer.concat(chunks));
      callback(undefined, {
        secure_url: `https://res.cloudinary.com/upload-test/image/upload/${options.folder}/${options.public_id}.png`,
        public_id: `${options.folder}/${options.public_id}`,
      });
    });
    return stream;
  });
}

test("uploads require admin authorization before body processing or Cloudinary calls", async () => {
  const upload = fakeCloudinary();
  for (const [error, status] of [
    [new auth.UnauthorizedError("Authentication required"), 401],
    [new auth.ForbiddenError("Admin access required"), 403],
  ]) {
    auth.setError(error);
    const input = new Request("https://store.test/api/admin/uploads/products", {
      method: "POST",
      body: "bad",
    });
    assert.equal((await POST(input)).status, status);
    assert.equal(input.bodyUsed, false);
  }
  assert.equal(upload.mock.callCount(), 0);
});

test("JPEG, PNG and WebP are decoded, uploaded and returned in the existing metadata contract", async () => {
  const upload = fakeCloudinary((options, bytes) => {
    assert.equal(options.folder, "aylol-nest/products");
    assert.equal(options.overwrite, false);
    assert.equal(options.resource_type, "image");
    assert.equal(options.api_secret, "upload-test");
    assert.match(options.public_id, /^[a-f0-9-]{36}$/);
    assert.ok(bytes.length > 0 && bytes.length <= MAX_PRODUCT_IMAGE_BYTES);
  });
  for (const format of ["jpeg", "png", "webp"]) {
    const response = await POST(
      request(new File([await fixture(format)], `photo.${format}`, { type: `image/${format}` })),
    );
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.deepEqual(Object.keys(data.image).sort(), ["publicId", "url"]);
    assert.ok(data.image.url.startsWith("https://res.cloudinary.com/"));
    const input = createProductSchema.parse({
      name: { ar: "صورة", en: "Image" },
      slug: "image-test",
      category: "507f1f77bcf86cd799439012",
      gender: "unisex",
      ageGroup: "kids",
      images: [{ ...data.image, alt: { ar: "صورة المنتج", en: "Product photo" } }],
      variants: [
        {
          sku: "IMAGE-2Y",
          size: "2Y",
          color: { name: { ar: "بيج", en: "Beige" }, hex: "#eeddbb" },
          price: 120,
        },
      ],
    });
    const document = new Product(input);
    await document.validate();
    assert.equal(document.images[0].publicId, data.image.publicId);
    assert.equal(document.images[0].alt.en, "Product photo");
  }
  assert.equal(upload.mock.callCount(), 3);
});

test("client policy rejects unsupported, empty and oversized files", () => {
  for (const [file, code] of [
    [{ type: "image/svg+xml", size: 20 }, "imageType"],
    [{ type: "image/png", size: 0 }, "imageInvalid"],
    [{ type: "image/jpeg", size: MAX_PRODUCT_IMAGE_BYTES + 1 }, "imageSize"],
  ]) {
    assert.throws(
      () => validateProductImageFile(file),
      (error) => error.code === code,
    );
  }
  assert.doesNotThrow(() =>
    validateProductImageFile({ type: "image/webp", size: MAX_PRODUCT_IMAGE_BYTES }),
  );
});

test("server rejects MIME spoofing, corrupt headers, unsupported formats and empty files", async () => {
  const upload = fakeCloudinary();
  for (const file of [
    new File(["<svg></svg>"], "image.png", { type: "image/png" }),
    new File([await fixture("png")], "image.jpg", { type: "image/jpeg" }),
    new File([(await fixture("png")).subarray(0, 40)], "truncated.png", { type: "image/png" }),
    new File([], "empty.png", { type: "image/png" }),
  ]) {
    const response = await POST(request(file));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, "imageInvalid");
  }
  const unsupported = await POST(request(new File(["gif"], "photo.gif", { type: "image/gif" })));
  assert.equal(unsupported.status, 415);
  assert.equal(upload.mock.callCount(), 0);
});

test("server rejects oversized files, malformed multipart and client-controlled IDs", async () => {
  const tooLarge = new File([new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1)], "large.png", {
    type: "image/png",
  });
  assert.equal((await POST(request(tooLarge))).status, 413);
  assert.equal(
    (await POST(request(new File([await fixture()], "photo.png", { type: "image/png" }), true)))
      .status,
    400,
  );
  assert.equal(
    (
      await POST(
        new Request("https://store.test/api/admin/uploads/products", {
          method: "POST",
          body: "{}",
          headers: { "content-type": "application/json" },
        }),
      )
    ).status,
    400,
  );
  const multiple = new FormData();
  for (let i = 0; i < 2; i++)
    multiple.append("file", new File([await fixture()], "image.png", { type: "image/png" }));
  assert.equal(
    (
      await POST(
        new Request("https://store.test/api/admin/uploads/products", {
          method: "POST",
          body: multiple,
        }),
      )
    ).status,
    400,
  );
});

test("body limit is enforced even without Content-Length", async () => {
  let canceled = false;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024));
    },
    cancel() {
      canceled = true;
    },
  });
  const input = new Request("https://store.test/api/admin/uploads/products", {
    method: "POST",
    body,
    duplex: "half",
    headers: { "content-type": "multipart/form-data; boundary=test" },
  });
  await assert.rejects(
    () => readProductImage(input),
    (error) => error.status === 413,
  );
  assert.equal(canceled, true);
  const declared = new Request("https://store.test/api/admin/uploads/products", {
    method: "POST",
    body: "x",
    headers: {
      "content-type": "multipart/form-data; boundary=test",
      "content-length": String(MAX_UPLOAD_BODY_BYTES + 1),
    },
  });
  await assert.rejects(
    () => readProductImage(declared),
    (error) => error.status === 413,
  );
  assert.equal(declared.bodyUsed, false);
});

test("decoder rejects oversized dimensions and removes EXIF metadata", async () => {
  const enormous = await sharp({
    create: { width: 6500, height: 6500, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    () => decodeProductImage(new File([enormous], "huge.png", { type: "image/png" })),
    (error) => error.code === "imageInvalid",
  );
  const withExif = await sharp(await fixture("jpeg"))
    .withExif({ IFD0: { Copyright: "private metadata" } })
    .jpeg()
    .toBuffer();
  const decoded = await decodeProductImage(
    new File([withExif], "photo.jpg", { type: "image/jpeg" }),
  );
  assert.equal((await sharp(decoded).metadata()).exif, undefined);
});

test("configuration and upstream failures return safe errors without leaking credentials", async () => {
  const file = new File([await fixture()], "photo.png", { type: "image/png" });
  delete process.env.CLOUDINARY_API_SECRET;
  const missing = await POST(request(file));
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).code, "uploadUnavailable");
  process.env.CLOUDINARY_API_SECRET = "never-show-this";
  mock.method(cloudinary.uploader, "upload_stream", () => {
    throw new Error("never-show-this");
  });
  const failed = await POST(request(file));
  assert.equal(failed.status, 502);
  const result = await failed.text();
  assert.ok(result.includes("uploadFailed"));
  assert.ok(!result.includes("never-show-this"));
});

test("cross-origin upload attempts are rejected", async () => {
  const input = request(new File([await fixture()], "photo.png", { type: "image/png" }));
  input.headers.set("origin", "https://other.test");
  assert.equal((await POST(input)).status, 403);
});
