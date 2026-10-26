# Product management UI

The page is available at `/ar/admin/products` and `/en/admin/products`. The existing
admin layout provides authorization, AdminShell, sidebar navigation, language
switching and the shared theme provider. No authentication, models, API routes,
category screens or customer pages were changed for this UI task.

## Files and responsibilities

Created:

- `src/app/[locale]/admin/products/page.tsx`: route entry inside the existing admin layout.
- `src/components/admin/products/ProductsManager.tsx`: filters, notifications and modal workflows.
- `src/components/admin/products/ProductsTable.tsx`: desktop table, mobile cards, loading/empty states and pagination.
- `src/components/admin/products/ProductFormModal.tsx`: shared create/edit form.
- `src/components/admin/products/ProductVariantsEditor.tsx`: sizes, colors, prices and inventory.
- `src/components/admin/products/ProductImagesManager.tsx`: existing image URLs, previews, descriptions and removal.
- `src/components/admin/products/ProductDetailsModal.tsx`: read-only product data and image gallery.
- `src/components/admin/products/DeleteProductModal.tsx`: deletion confirmation and order-reference errors.
- `src/components/admin/products/ProductUi.tsx`: product-specific styling and wrappers around existing Button, Input, Textarea and Radix Dialog components.
- `src/hooks/admin/useProducts.ts`: list/category/detail requests, cancellation, mutation locking and refresh.
- `src/hooks/admin/useProductForm.ts`: form state and localized validation feedback.
- `src/types/product.ts`: serialized response/form types derived from the existing Zod contract; reuses category types.
- `src/lib/products/form.ts`: initial values, validation, field-level PATCH differences, stock totals and ILS price ranges.
- `src/lib/products/client.ts`: API requests and user-facing error classifications.
- `tests/products-ui.test.mjs`: payload, API error and bilingual rendering regression tests.
- `docs/admin-products-ui.md`: this handoff.

Modified: `messages/ar.json` and `messages/en.json`, adding the `Products` namespace.
The API implementation and its documentation/tests from the preceding task remain
in the working tree separately.

## API integration

The list calls `GET /api/admin/products` with debounced name search, category and
active-state filters, sorting, and 12 products per page. Counts and pagination come
from the server. Obsolete list/detail requests are aborted and their results ignored.
Pages are corrected if deletion or filtering leaves the current page out of range.

Categories come from `GET /api/admin/categories`; failures have an independent retry
control. Details and edit workflows retrieve fresh data from
`GET /api/admin/products/:id`. Create, edit, status and delete use the existing POST,
PATCH and DELETE endpoints. Mutations are locked against duplicate submission.
Successful mutations trigger a separate refresh; a refresh failure does not report
the save as failed or invite a duplicate creation.

PATCH sends only changed fields, including individual translated fields and variant
fields. Editing a name does not resend stock from the form's original snapshot.
Server restrictions remain authoritative. Unauthorized, forbidden, validation,
duplicate-link, missing-product, concurrent-change, network and order-reference
errors are presented in Arabic or English without exposing raw database errors.

## Supported fields and inventory behavior

- Arabic/English names and descriptions; slug; category; gender; age group.
- Active, featured and new-arrival flags; display order.
- Product and variant images with HTTPS URL, required media reference and bilingual alternative text.
- Variant SKU, size, bilingual color names, hex code, stock, price in ILS,
  optional original price, and active status.
- Total stock in the editor, available stock from active variants, and price ranges.
- Details include persisted timestamps, category, descriptions and variants.

New, unsaved variants can be removed. Saved variants retain their identifiers and
can be deactivated, matching the API's merge semantics and preserving order links.
The form explains this distinction. Negative/fractional inventory and duplicate
SKUs or size/color combinations are rejected using the existing backend validators.

There is no top-level product price: each variant has its own price. Image arrays
are replaced only when edited. Removing an image from the form removes its product
reference; it does not delete the remote file.

## Images, accessibility and visual behavior

Direct image uploads remain pending because there is no upload endpoint. The UI
supports real existing image URLs and clearly says uploads are unavailable. No
fake progress indicator, credentials or upload infrastructure were added.

The page uses the existing warm light/dark palette, logical alignment for RTL,
mobile product cards, contained desktop table scrolling, scrollable dialogs,
44px action controls, labeled fields, live status/error messages, and Radix focus
trapping/Escape handling. Focus returns to the opening control, or the Add button
when a refreshed list has removed that control. Close controls are disabled during
mutations. All product UI strings use next-intl's existing message files.

## Verification and limitations

Run from `app`:

```text
npm run typecheck
npm run lint
npm run format:check
node --test tests/products.test.mjs tests/products-ui.test.mjs
```

The UI suite uses installed TypeScript, React and next-intl without adding test
dependencies. It checks real form logic, API error handling and server rendering
in both languages. Backend operations in the existing API suite are mocked.

Browser verification and authenticated live CRUD remain pending. The local Next
development server could not load the installed native SWC binding because its
cache fails Windows sandbox ownership/permission checks; a temporary cache also
failed. No browser automation package is installed. Static rendering checks verify
localized content and responsive/theme markup, but do not establish actual visual
layout, focus behavior or light/dark appearance in a browser.

The API compares versions for overlapping writes, but does not accept a client
version precondition. Two stale editors explicitly changing the same field still
need a future backend/client concurrency contract for stronger protection.
Cloudinary upload integration and the existing order-creation/deletion coordination
limitation remain as documented in `admin-products-api.md`.
