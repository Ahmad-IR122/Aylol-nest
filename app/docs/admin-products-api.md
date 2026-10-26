# Admin product API

All endpoints use the existing `requireAdmin()` helper, which establishes the database
connection through `getCurrentUser()` and `connectDB()`. Clerk authentication and an
active database user with the admin role are required. Request bodies are JSON.

| Endpoint                         | Behavior                                                                       | Success |
| -------------------------------- | ------------------------------------------------------------------------------ | ------- |
| `GET /api/admin/products`        | Search, filter, sort and paginate products, including inactive ones by default | 200     |
| `POST /api/admin/products`       | Create a product with at least one complete variant                            | 201     |
| `GET /api/admin/products/:id`    | Retrieve a product with its category                                           | 200     |
| `PATCH /api/admin/products/:id`  | Partially edit product fields, variants, inventory or activation               | 200     |
| `DELETE /api/admin/products/:id` | Permanently delete an unreferenced product                                     | 200     |

## Listing

Example:

```text
/api/admin/products?search=winter&category=507f1f77bcf86cd799439012&isActive=true&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

Optional parameters:

- `search`: literal, case-insensitive substring of Arabic or English name; maximum 200 characters.
- `category`: 24-character hexadecimal category ObjectId.
- `isActive`: exactly `true` or `false`.
- `page`: positive integer, default 1, maximum 100000.
- `limit`: positive integer, default 20, maximum 100.
- `sortBy`: `createdAt` (default), `updatedAt`, `sortOrder`, `name.ar`, or `name.en`.
- `sortOrder`: `desc` (default) or `asc`. `_id` provides deterministic tie-breaking.

Unknown or repeated parameters are rejected. Category is populated with `_id`, `name`,
and `slug` on list, detail, create and update responses. A legacy missing category
can populate as `null`. An empty list returns:

```json
{
  "products": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

## Create example

```json
{
  "name": { "ar": "طقم أطفال شتوي", "en": "Winter Kids Set" },
  "slug": "winter-kids-set",
  "description": { "ar": "طقم شتوي دافئ", "en": "A warm winter set" },
  "category": "507f1f77bcf86cd799439012",
  "gender": "unisex",
  "ageGroup": "toddler",
  "images": [
    {
      "url": "https://res.cloudinary.com/YOUR_CLOUD/image/upload/products/winter-set.jpg",
      "publicId": "products/winter-set",
      "alt": { "ar": "طقم شتوي", "en": "Winter set" }
    }
  ],
  "variants": [
    {
      "sku": "WINTER-2Y-BEIGE",
      "size": "2Y",
      "color": { "name": { "ar": "بيج", "en": "Beige" }, "hex": "#EEDDBB" },
      "stock": 5,
      "price": 120,
      "compareAtPrice": 150,
      "isActive": true
    }
  ],
  "isActive": true
}
```

Use a real existing category ID and your own image URL/public ID. Images are optional.
Required product fields are `name.ar`, `name.en`, `slug`, `category`, `gender`,
`ageGroup`, and a nonempty `variants` array. Every new variant requires `sku`, `size`,
both color names, `color.hex` and `price`. Stock defaults to zero. Prices are
nonnegative numbers in ILS, matching the existing order currency. There is no
top-level product price. Slugs are trimmed/lowercased and use ASCII letters, digits
and single hyphens between segments. SKUs are trimmed/uppercased.

The existing model supplies defaults and timestamps. Product flags `isFeatured`,
`isNewArrival`, `isActive`, and nonnegative integer `sortOrder` are supported.
Gender values: `boys`, `girls`, `unisex`. Age groups: `newborn`, `baby`, `toddler`, `kids`.
Stock must be a nonnegative safe integer. Variant SKUs and size/color combinations
(using case-insensitive English color names) must be unique within the product;
the schema does not enforce globally unique SKUs.

## Update examples

Change only the English name, deactivate the product, and set one variant's stock:

```json
{
  "name": { "en": "Winter Kids Set — Updated" },
  "isActive": false,
  "variants": [{ "_id": "507f1f77bcf86cd799439013", "stock": 8 }]
}
```

Use the variant `_id` returned by GET. Existing variant edits merge by `_id`;
omitted variants, fields, languages and IDs are preserved. Stock is an absolute
quantity, not a delta. An entry without `_id` appends a new complete variant:

```json
{
  "variants": [
    {
      "sku": "WINTER-4Y-BEIGE",
      "size": "4Y",
      "color": { "name": { "ar": "بيج", "en": "Beige" }, "hex": "#EEDDBB" },
      "stock": 7,
      "price": 120
    }
  ]
}
```

Variant omission never deletes a variant. Set a variant's `isActive` to `false`
to retire it while preserving order references. Unknown or repeated variant IDs
are rejected. Sending `images` replaces that specific image array; `[]` clears it.
Setting `compareAtPrice` to `null` clears that value. Unknown properties, update
operators, and client-supplied product IDs/timestamps/version fields are rejected.
An empty PATCH object is invalid; an already-applied edit succeeds without writing.

Concurrent edits through these endpoints compare and increment the existing `__v`
version. A conflict returns 409 so the client can reload and reconcile. This protects
overlapping requests; it is not a client-side version precondition for stale forms.
Future inventory writers must participate in versioning or use compatible atomic
updates. No schema migration is required.

## Responses and errors

Detail responses use `{ "product": ... }`. Create and update return
`{ "message": "Product created successfully", "product": ... }` and
`{ "message": "Product updated successfully", "product": ... }`, respectively,
with the full persisted product, including `_id`, variant IDs, timestamps and
populated category. For example, this is an abbreviated create response:

```json
{
  "message": "Product created successfully",
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": { "ar": "طقم أطفال شتوي", "en": "Winter Kids Set" },
    "slug": "winter-kids-set",
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": { "ar": "أطقم", "en": "Sets" },
      "slug": "sets"
    },
    "isActive": true
  }
}
```

Successful deletion returns:

```json
{ "message": "Product deleted successfully" }
```

Errors use `{ "message": "..." }`. Validation may additionally return field paths:

```json
{
  "message": "Invalid product input",
  "errors": [{ "path": "variants.0.stock", "message": "Too small: expected number to be >=0" }]
}
```

Statuses: 401 unauthenticated, 403 non-admin, 400 invalid body/query/ID/category
reference, 404 missing product, 409 duplicate slug, concurrent edit, or deletion
blocked by orders, and 500 unexpected failure without internal details.

## Compatibility and remaining integration

- No Product, Category, Order, auth, connection, customer UI or category API changes.
  Existing per-variant price/stock, bilingual fields, images and timestamps are reused.
- PATCH uses merge semantics for variants, not whole-array replacement. Clients must
  send existing variant IDs to edit them; image arrays use replacement semantics.
- DELETE follows the category API's reference-check strategy. All order statuses count;
  referenced products return 409 with instructions to deactivate. No images are deleted.
  Before adding checkout/order creation, coordinate those writes with deletion: the
  reference check and deletion are separate operations and cannot prevent a future
  concurrent order writer from adding a reference between them.
- Cloudinary SDK is installed, but no configured upload utility or endpoint exists.
  Upload integration remains pending. The API accepts existing absolute HTTPS image
  URLs with the schema-required `publicId`; it does not verify remote image ownership
  or availability. No credentials or binary image storage were added.
- Ensure the existing unique slug index is provisioned in production. Literal substring
  search uses regular expressions and may need search indexing at larger catalog sizes.
- Run `node --test tests/products.test.mjs` with Node 22.18+ (verified on Node 25.2.1).
  Tests use real validators/models/handlers with mocked authentication and database
  operations; live Clerk/MongoDB integration still needs environment-backed testing.
  Standard checks: `npm run lint`, `npm run typecheck`, `npm run format:check`.
