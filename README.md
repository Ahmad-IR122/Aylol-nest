# Aylol Nest

Aylol Nest is a full-stack e-commerce platform for children's clothing in Palestine. It provides a customer storefront for boys' and girls' clothing and an authenticated administration area for managing the catalog.

## Project Overview

Aylol Nest is designed for customers shopping for clothing from newborn sizes through the kids' age group, and for store staff managing products and categories.

- **Customer storefront:** localized home page, featured products, new arrivals, product details, product galleries, variants, and a client-side shopping cart.
- **Admin dashboard:** protected dashboard with product and category management, product variants, inventory values, and product image uploads.
- **Bilingual experience:** English and Arabic are supported through `next-intl`; Arabic pages render right-to-left and English pages render left-to-right.
- **Responsive UI:** the storefront and admin interface use responsive layouts for mobile, tablet, and desktop screens.

The application is located in [`app/`](./app).

## Tech Stack

The project currently uses:

| Area                         | Technology                                                                  |
| ---------------------------- | --------------------------------------------------------------------------- |
| Framework                    | Next.js 16.4.1 with the App Router                                          |
| UI                           | React 19.3.0, TypeScript, Tailwind CSS 4                                    |
| Components                   | Radix UI, shadcn, `class-variance-authority`, `lucide-react`, `react-icons` |
| Forms and validation         | React Hook Form, Zod                                                        |
| Authentication               | Clerk for Next.js and Clerk localizations                                   |
| Localization                 | `next-intl`                                                                 |
| Theme                        | `next-themes`                                                               |
| Database                     | MongoDB with Mongoose 9                                                     |
| Image processing and storage | Sharp and Cloudinary                                                        |
| Client state                 | Zustand                                                                     |
| Notifications                | Sonner                                                                      |
| Deployment configuration     | Vercel                                                                      |

## Features

### Customer Features

- [x] Localized home page with hero, categories, featured products, promotions, and new arrivals.
- [x] Product details pages with localized names and descriptions.
- [x] Product image galleries.
- [x] Product variants with size, bilingual color names, SKU, price, compare-at price, and stock.
- [x] English and Arabic routes.
- [x] RTL support for Arabic and LTR support for English.
- [x] Light and dark theme switching.
- [x] Clerk sign-in and sign-up pages.
- [x] Client-side shopping cart drawer with server-side catalog and stock validation.
- [ ] Checkout and order submission.
- [ ] Online payment processing.

### Admin Features

- [x] Admin dashboard with product, category, order, and customer counts.
- [x] Role-based admin route protection.
- [x] Category listing, creation, editing, and deletion APIs and UI.
- [x] Product listing, creation, editing, and deletion APIs and UI.
- [x] Product variants and inventory values.
- [x] Product image upload to Cloudinary.
- [x] Product activation, featured, and new-arrival flags.
- [ ] Order management UI and API.
- [ ] Customer management UI and API.
- [ ] Shipping-zone management UI and API.

The dashboard currently contains navigation entries for orders, customers, and shipping, but corresponding pages and management APIs are not present in the repository.

## Project Structure

```text
.
├── LICENSE
├── README.md
└── app/
    ├── messages/
    │   ├── ar.json
    │   └── en.json
    ├── public/
    │   └── images/
    ├── src/
    │   ├── app/
    │   │   ├── [locale]/
    │   │   │   ├── (store)/              # Storefront pages and layouts
    │   │   │   ├── admin/                # Admin dashboard pages
    │   │   │   ├── auth/
    │   │   │   ├── sign-in/
    │   │   │   ├── sign-up/
    │   │   │   └── layout.tsx
    │   │   ├── api/
    │   │   │   ├── admin/                 # Protected catalog and upload APIs
    │   │   │   ├── health/db/
    │   │   │   └── webhooks/clerk/
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── admin/
    │   │   ├── cart/
    │   │   ├── home/
    │   │   ├── layout/
    │   │   ├── products/
    │   │   ├── providers/
    │   │   └── ui/
    │   ├── hooks/admin/
    │   ├── i18n/
    │   ├── lib/
    │   │   ├── auth/
    │   │   ├── cart/
    │   │   ├── db/
    │   │   ├── products/
    │   │   └── cloudinary.ts
    │   ├── models/
    │   ├── scripts/
    │   ├── types/
    │   └── proxy.ts
    ├── .env.example
    ├── next.config.ts
    ├── package.json
    └── vercel.json
```

## Getting Started

### Prerequisites

- Node.js 20.9 or newer, as required by Next.js 16.
- npm. The repository includes [`app/package-lock.json`](./app/package-lock.json).
- A MongoDB database.
- Clerk, Cloudinary, and Clerk webhook configuration for the corresponding features.

### Installation

```bash
git clone https://github.com/Ahmad-IR122/Aylol-nest.git
cd Aylol-nest/app
npm install
```

### Environment Variables

Create `app/.env.local` using [`app/.env.example`](./app/.env.example). Use your own values; never commit credentials.

| Variable                            | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `MONGODB_URI`                       | MongoDB connection string                        |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public Clerk key used by the browser             |
| `CLERK_SECRET_KEY`                  | Server-side Clerk secret                         |
| `CLERK_WEBHOOK_SIGNING_SECRET`      | Clerk webhook verification secret                |
| `CLOUDINARY_CLOUD_NAME`             | Cloudinary cloud name                            |
| `CLOUDINARY_API_KEY`                | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET`             | Server-side Cloudinary API secret                |
| `NEXT_PUBLIC_APP_URL`               | Application URL, such as `http://localhost:3000` |

### Development

From the `app/` directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Localized storefront routes use the `/ar` and `/en` prefixes, for example `/ar` and `/en`.

### Production Build

```bash
npm run build
npm run start
```

## Authentication and Authorization

Clerk provides authentication for the application. The locale layout selects the Arabic (`arSA`) or English (`enUS`) Clerk localization.

The application stores a synchronized user record in MongoDB:

- New users are created as `customer` records by the Clerk webhook.
- Users with the `admin` role and `isActive: true` can access the admin area.
- Unauthenticated users attempting to open an admin page are redirected to the localized sign-in page.
- Authenticated users without an active admin role are redirected to the storefront.
- Admin API routes call `requireAdmin()` and return `401` for unauthenticated requests or `403` for non-admin users.

## Database Models

Mongoose models are defined in [`app/src/models/`](./app/src/models/).

| Collection       | Responsibility                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `users`          | Clerk-linked user identity, role (`customer` or `admin`), and active status                     |
| `categories`     | Bilingual category names/descriptions, slugs, optional parent category, image URL, and ordering |
| `products`       | Bilingual product content, category, gender, age group, flags, images, and variants             |
| `orders`         | Order items, shipping address and zone, totals, payment status, and fulfillment status schema   |
| `shipping_zones` | Bilingual zone names, cities, fees, delivery estimates, and active status                       |

Product variants support unique SKUs, sizes, bilingual color names, color hex values, stock counts, prices, compare-at prices, and variant images. The current storefront cart validates product and stock data but does not create orders.

## API Reference

All paths below are relative to the application origin.

| Method   | Endpoint                      | Purpose                                            | Authentication          |
| -------- | ----------------------------- | -------------------------------------------------- | ----------------------- |
| `GET`    | `/api/health/db`              | Check MongoDB connectivity                         | Public                  |
| `POST`   | `/api/webhooks/clerk`         | Synchronize Clerk user create/update/delete events | Clerk webhook signature |
| `GET`    | `/api/admin/check`            | Verify the current user's admin access             | Admin                   |
| `GET`    | `/api/admin/categories`       | List categories                                    | Admin                   |
| `POST`   | `/api/admin/categories`       | Create a category                                  | Admin                   |
| `GET`    | `/api/admin/categories/:id`   | Get one category                                   | Admin                   |
| `PATCH`  | `/api/admin/categories/:id`   | Update a category                                  | Admin                   |
| `DELETE` | `/api/admin/categories/:id`   | Delete a category when allowed                     | Admin                   |
| `GET`    | `/api/admin/products`         | List, filter, search, sort, and paginate products  | Admin                   |
| `POST`   | `/api/admin/products`         | Create a product                                   | Admin                   |
| `GET`    | `/api/admin/products/:id`     | Get one product                                    | Admin                   |
| `PATCH`  | `/api/admin/products/:id`     | Update a product and its variants                  | Admin                   |
| `DELETE` | `/api/admin/products/:id`     | Delete a product when it has no order references   | Admin                   |
| `POST`   | `/api/admin/uploads/products` | Validate, process, and upload one product image    | Admin                   |

There are currently no customer checkout, order creation, customer management, or shipping management API routes.

## Product Image Management

Product image uploads are handled by the admin upload endpoint:

1. An authenticated admin selects one JPEG, PNG, or WebP image.
2. The server validates the multipart request and enforces the upload size and pixel limits.
3. Sharp verifies, auto-orients, and re-encodes the image.
4. The processed image is uploaded to Cloudinary under `aylol-nest/products`.
5. Cloudinary returns a secure URL and public ID.
6. The product form stores that image metadata with the product or variant.
7. The storefront renders the saved Cloudinary image.

## Internationalization

The supported locales are `ar` and `en`, configured in [`app/src/i18n/routing.ts`](./app/src/i18n/routing.ts). Locale prefixes are always present:

- Arabic: `/ar/...` with `<html lang="ar" dir="rtl">`
- English: `/en/...` with `<html lang="en" dir="ltr">`

Translations are stored in [`app/messages/ar.json`](./app/messages/ar.json) and [`app/messages/en.json`](./app/messages/en.json). When adding user-facing text, add the same message key to both files and consume it through `next-intl`.

## Theme Support

The application uses `next-themes` through [`app/src/components/providers/theme-provider.tsx`](./app/src/components/providers/theme-provider.tsx). It supports light, dark, and system themes. The theme is applied through the `class` attribute, system preference is enabled, and the selected theme is persisted client-side by `next-themes`.

## Shipping and Payment

The following are business requirements represented in the domain model, not completed checkout functionality:

### Payment

- Cash on Delivery (COD) is the intended default payment method.
- The order schema also contains an `online` payment option, but no online payment integration exists.

### Shipping Regions

| Region          | Planned fee |
| --------------- | ----------: |
| West Bank       |         ₪20 |
| Jerusalem       |         ₪30 |
| Inside 48 Areas |         ₪70 |

Shipping-zone data structures exist in the Mongoose model, but shipping administration, checkout calculation, and order submission are not implemented.

## Development Workflow

Available npm scripts are defined in [`app/package.json`](./app/package.json):

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the Next.js development server  |
| `npm run build`        | Create a production build             |
| `npm run start`        | Start the production server           |
| `npm run lint`         | Run ESLint                            |
| `npm run typecheck`    | Run TypeScript without emitting files |
| `npm run format`       | Format the project with Prettier      |
| `npm run format:check` | Verify Prettier formatting            |

Use focused feature branches for changes and open a pull request against the repository's main development branch. Branch protection and CI requirements are not defined in the repository configuration.

## Deployment

The project is configured for deployment on Vercel. Set all production environment variables in the Vercel project settings, then build and deploy the `app/` project directory.

The checked-in [`app/vercel.json`](./app/vercel.json) disables automatic Git deployments, so deployments should follow the team's chosen manual or external workflow. Production builds use:

```bash
npm run build
npm run start
```

## Project Roadmap

- [x] Clerk authentication and localized sign-in/sign-up
- [x] Admin authorization and dashboard
- [x] Category management
- [x] Product management
- [x] Product variants and inventory fields
- [x] Cloudinary product image integration
- [x] Customer home page and product sections
- [x] Product details
- [x] Client-side shopping cart
- [ ] Checkout and order creation
- [ ] Order management
- [ ] Customer management
- [ ] Shipping management and fee calculation
- [ ] Payment processing beyond the planned COD flow

## Screenshots

No committed screenshots were found in the repository. Screenshots can be added here later using paths relative to this README.

## License

This project is licensed under the [MIT License](./LICENSE). Copyright © 2026 Ahmad Irshaid and Mohammad Zyoud.
