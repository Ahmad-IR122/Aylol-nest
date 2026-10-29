import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { inspectAssets, inspectCategories, productPlan } from "../src/scripts/seed-products.mjs";

test("product plan has 40 unique bilingual items and distinct image requirements", () => {
  assert.equal(productPlan.length, 40);
  assert.equal(new Set(productPlan.map((item) => item.slug)).size, 40);
  assert.equal(new Set(productPlan.map((item) => item.imagePath)).size, 40);
  for (const item of productPlan) {
    assert.ok(item.name.ar && item.name.en && item.description.ar && item.description.en);
    assert.ok(item.sizes.length >= 4 && item.price > 0 && item.stock > 0);
  }
});

test("missing categories and photos block the seed before writes", () => {
  assert.throws(() => inspectCategories([]), /Run Categories Seed first/);
  assert.throws(() => inspectAssets(), /No products were written/);
});

test("production apply is rejected before database access", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("../src/scripts/seed-products.mjs", import.meta.url)), "--apply"],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: { ...process.env, NODE_ENV: "production", SEED_PRODUCTS_TARGET: "development" },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Production writes are blocked/);
});
