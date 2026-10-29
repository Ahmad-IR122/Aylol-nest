import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { categoryPlan, inspectPlan } from "../src/scripts/seed-categories.mjs";

const root = { _id: "root-id", parent: null, isActive: true };

test("seed plan has 21 unique categories under the existing root", () => {
  assert.equal(categoryPlan.length, 21);
  assert.equal(new Set(categoryPlan.map((item) => item.slug)).size, 21);
  const slugs = new Set(categoryPlan.map((item) => item.slug));
  for (const item of categoryPlan) {
    assert.ok(item.parentSlug === "kids-clothing" || slugs.has(item.parentSlug));
    assert.ok(item.name.ar && item.name.en && item.description.ar && item.description.en);
    assert.ok(Number.isSafeInteger(item.sortOrder) && item.sortOrder > 0);
  }
});

test("seed preflight refuses a missing root or conflicting existing parent", () => {
  assert.throws(() => inspectPlan(null, []), /Required root category/);
  assert.throws(() => inspectPlan({ ...root, parent: "another-id" }, []), /not an active root/);
  assert.throws(
    () => inspectPlan(root, [{ slug: "boys-clothing", _id: "boys-id", parent: "wrong-id" }]),
    /different parent/,
  );
  assert.throws(
    () => inspectPlan(root, [{ slug: "boys-t-shirts", _id: "shirt-id", parent: "boys-id" }]),
    /planned parent/,
  );
  assert.throws(
    () =>
      inspectPlan(root, [
        { slug: "boys-clothing", _id: "boys-one", parent: root._id },
        { slug: "boys-clothing", _id: "boys-two", parent: root._id },
      ]),
    /Duplicate planned slugs/,
  );
});

test("seed preflight accepts correctly nested existing categories without changing them", () => {
  const existing = [
    { slug: "boys-clothing", _id: "boys-id", parent: root._id },
    { slug: "boys-t-shirts", _id: "shirt-id", parent: "boys-id" },
  ];
  const snapshot = structuredClone(existing);
  assert.equal(inspectPlan(root, existing).size, 2);
  assert.deepEqual(existing, snapshot);
});

test("production writes require a separate authorization gate", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("../src/scripts/seed-categories.mjs", import.meta.url)), "--apply"],
    {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: {
        ...process.env,
        NODE_ENV: "production",
        SEED_CATEGORIES_TARGET: "production",
        SEED_CATEGORIES_ALLOW_PRODUCTION: "0",
      },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Production writes are blocked/);
});
