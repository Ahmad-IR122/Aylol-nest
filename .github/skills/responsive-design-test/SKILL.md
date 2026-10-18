---
name: responsive-design-test
description: Test and fix responsive design across ALL screen sizes (320px phones to 2560px ultrawide) for this Next.js 16 + Tailwind CSS 4 + shadcn/ui (Radix) app. Use this skill whenever the user asks to check, audit, test, review or fix responsiveness, mobile/tablet/desktop layout, breakpoints, overflow, RTL/LTR layout, dark/light theme appearance, or "make the design consistent on all screens", and whenever a new page, layout, component, form, table, dialog, or navigation is created or changed in the frontend, even if the user does not say the word "responsive".
---

# Responsive Design Test (Next.js 16 + Tailwind 4 + shadcn/ui)

Goal: every screen looks **cohesive and continuous** from 320px to 2560px. The
design must feel like one system that stretches and reflows, not separate
layouts glued together at breakpoints.

## Stack facts this skill relies on

| Concern | Library | What to remember |
|---|---|---|
| Framework | `next` 16, `react` 19 | App Router, server components by default; use `next/image` with `sizes` |
| Styling | `tailwindcss` 4 | Mobile-first. Config lives in CSS (`@theme` in `globals.css`), not `tailwind.config.js` |
| UI kit | `shadcn`, `radix-ui`, `class-variance-authority`, `cn` | Variants via `cva`; merge classes with `cn()` |
| Animation | `tw-animate-css` | Respect `motion-reduce:` |
| Icons | `lucide-react`, `react-icons` | Size with `size-*`, never fixed `width` attributes |
| i18n | `next-intl`, `@clerk/localizations` | Text length changes per language; **RTL** (e.g. Arabic) must work |
| Theme | `next-themes` | Test light + dark at every size |
| Forms | `react-hook-form`, `zod` | Error messages must not break layout |
| Toasts | `sonner` | Must not cover primary actions on mobile |
| Auth UI | `@clerk/nextjs` | Embedded Clerk components must fit 320px |
| State | `zustand` | Sidebar/menu open state must reset sensibly on resize |
| Images | `cloudinary` | Use responsive transforms + `next/image` `sizes` |

## Viewport matrix (always test all of these)

Tailwind 4 default breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
Test **at and one pixel below** each breakpoint to catch jumps.

| Name | Width x Height | Represents |
|---|---|---|
| xs-phone | 320 x 568 | Smallest supported phone (hard floor) |
| phone | 375 x 667 | iPhone SE / small Android |
| phone-lg | 430 x 932 | Large phones |
| tablet-portrait | 768 x 1024 | iPad portrait |
| tablet-landscape | 1024 x 768 | iPad landscape / small laptop |
| laptop | 1280 x 800 | Common laptop |
| desktop | 1536 x 864 | Full HD scaled |
| wide | 1920 x 1080 | Full HD |
| ultrawide | 2560 x 1080 | Ultrawide (content must not stretch endlessly) |

Boundary widths to also check: 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1535, 1536.

The app ships two locales: **English (`en`, LTR)** and **Arabic (`ar`, RTL)**.
For every viewport run **4 variants**: `en+light`, `en+dark`, `ar+light`, `ar+dark`.
RTL is a first-class requirement, never optional. Arabic is the stress test: if a
screen works in `ar`, logical spacing and icon mirroring are almost certainly correct.

## Workflow

1. **Discover routes.** List every page under `app/` (including `[locale]` segments, route groups, loading/error/not-found, and Clerk sign-in/sign-up pages). Build the list of screens to test.
2. **Static scan first** (fast, no browser). Run the grep checks in "Static checks" below and fix what you find.
3. **Run the app** with `npm run dev` (or `npm run build && npm run start` for production fidelity).
4. **Browser test** with Playwright across the matrix (script below), or manually via DevTools device toolbar if Playwright is unavailable. Do not add Playwright to `package.json` without asking the user; use `npx playwright` or a temp install.
5. **Evaluate** every screenshot against the Checklists.
6. **Fix** using the Fix Rules. Prefer fixing the shared component (`components/ui/*`, layout) over patching one page.
7. **Re-run** the matrix, then `npm run typecheck`, `npm run lint`, `npm run format:check`.
8. **Report** using the Report Template.

## Static checks (grep / read the code)

Flag and fix:

- Fixed pixel widths on containers: `w-[600px]`, `width: 800px`, `min-w-[...]` larger than 320 without a breakpoint guard.
- `h-screen` / `100vh` for full-height areas. Use `min-h-dvh` / `h-dvh` (mobile browser bars).
- Desktop-first patterns: `max-md:`, `max-sm:` used to *undo* desktop styles. Write base styles for mobile, then add `sm:` `md:` `lg:`.
- Physical direction utilities that break RTL: `ml-* mr-* pl-* pr-* left-* right-* text-left text-right border-l border-r rounded-l rounded-r`. Replace with logical ones: `ms-* me-* ps-* pe-* start-* end-* text-start text-end border-s border-e rounded-s rounded-e`.
- Directional icons (chevrons, arrows) without `rtl:rotate-180` (or `rtl:-scale-x-100`).
- Hard-coded colors (`#fff`, `bg-white`, `text-black`) instead of theme tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`), which break dark mode.
- `<img>` instead of `next/image`; `next/image` missing `sizes`; missing `alt`; fixed `width/height` that ignore container.
- Tables without a horizontal scroll wrapper (`overflow-x-auto`) or a mobile card layout.
- Text containers without `min-w-0` + `truncate` / `break-words` inside flex rows (classic overflow bug).
- Tap targets below 44x44px (`size-8` icon buttons on touch screens need padding or `size-11` on mobile).
- Inputs with font size under 16px on mobile (iOS zoom): ensure `text-base md:text-sm`.
- Fixed/sticky bars ignoring safe areas: add `pb-[env(safe-area-inset-bottom)]` / `pt-[env(safe-area-inset-top)]`; layout needs `viewport-fit=cover` via Next `viewport` export.
- Missing `viewport` export (Next sets a default; verify no `user-scalable=no` / `maximum-scale=1` that blocks zoom).

## Browser test script (Playwright)

Create `scripts/responsive-test.mjs` (temporary; ask before committing):

```js
// Run: npx playwright install chromium && node scripts/responsive-test.mjs
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Every route is tested in BOTH locales. Pass locale-less paths, e.g. ROUTES="/,/dashboard"
const LOCALES = ["en", "ar"];
const PATHS = (process.env.ROUTES ?? "/").split(",");
const ROUTES = LOCALES.flatMap((l) => PATHS.map((p) => `/${l}${p === "/" ? "" : p}`));
const OUT = "responsive-report";

const VIEWPORTS = [
  [320, 568], [375, 667], [430, 932], [639, 900], [640, 900],
  [767, 1024], [768, 1024], [1023, 768], [1024, 768],
  [1280, 800], [1536, 864], [1920, 1080], [2560, 1080],
];
const THEMES = ["light", "dark"];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const problems = [];

for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const [width, height] of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width, height },
        colorScheme: theme,
        hasTouch: width < 1024,
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(BASE + route, { waitUntil: "networkidle" });

      // 1. Horizontal overflow
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        const offenders = [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1)
          .slice(0, 5)
          .map((el) => el.tagName.toLowerCase() + "." + [...el.classList].join("."));
        return { scrolls: de.scrollWidth > de.clientWidth, offenders };
      });
      if (overflow.scrolls)
        problems.push({ route, theme, width, type: "h-overflow", detail: overflow.offenders });

      // 2. Tap targets < 44px on touch widths
      if (width < 1024) {
        const small = await page.evaluate(() =>
          [...document.querySelectorAll("a,button,[role=button],input,select")]
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && (r.width < 44 || r.height < 44);
            })
            .slice(0, 5)
            .map((el) => el.outerHTML.slice(0, 80)),
        );
        if (small.length) problems.push({ route, theme, width, type: "small-tap-target", detail: small });
      }

      // 3. Console errors (hydration, image sizes, etc.)
      if (errors.length) problems.push({ route, theme, width, type: "console", detail: errors.slice(0, 3) });

      await page.screenshot({
        path: `${OUT}/${route.replace(/\W+/g, "_") || "home"}-${theme}-${width}x${height}.png`,
        fullPage: true,
      });
      await ctx.close();
    }
  }
}
await browser.close();
fs.writeFileSync(`${OUT}/problems.json`, JSON.stringify(problems, null, 2));
console.log(problems.length ? problems : "No automated problems found");
```

For each `/ar/...` route, the script must confirm `<html lang="ar" dir="rtl">`, and `/en/...` must be `dir="ltr"`.
Adjust the route prefix if your `next-intl` routing uses `localePrefix: "as-needed"` (default locale has no prefix).
For authenticated screens, sign in once and reuse `storageState`, or use a Clerk test user. Never hard-code credentials.

Automated checks catch overflow and tap targets only. **Always view the screenshots** for visual continuity.

## Checklists

### A. Cohesion across sizes (the core requirement)

- [ ] Same visual language at every width: same radius, shadow, border, color tokens, icon set. Only layout density changes.
- [ ] No layout "jump" when crossing a breakpoint (compare 639 vs 640, 767 vs 768, 1023 vs 1024). Elements should reflow, not vanish or teleport.
- [ ] Spacing follows one scale (`gap-2/4/6/8`, `p-4 md:p-6 lg:p-8`); no one-off pixel values.
- [ ] Typography scales smoothly: prefer `text-sm md:text-base lg:text-lg` or fluid `clamp()` in `@theme`; line length 45-80 characters.
- [ ] Content has a max width on large screens (`mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8`); ultrawide never shows stretched text or a lonely centered column with no purpose.
- [ ] Same content available on every size (nothing important hidden with `hidden md:block` unless an equivalent exists on mobile).
- [ ] Navigation keeps the same information architecture: bottom/hamburger/Sheet on mobile -> sidebar/top nav on desktop, same items and order.
- [ ] Z-index layers consistent: header < dropdown < sheet/dialog < toast.

### B. Layout and overflow

- [ ] No horizontal page scroll at any width, including 320px.
- [ ] Grids collapse cleanly: `grid-cols-1 sm:grid-cols-2 lg:3 xl:4`; use `auto-fit/minmax` for card grids.
- [ ] Flex rows wrap or stack: `flex-col sm:flex-row`, `flex-wrap`, `min-w-0` on text children.
- [ ] Long strings (emails, Arabic names, URLs, translated labels) truncate or wrap, never push layout.
- [ ] Sticky header/footer do not cover content; use `scroll-mt-*` for anchors.
- [ ] Full-height screens use `min-h-dvh`; no double scrollbars.
- [ ] Landscape phone (e.g. 667x375): header not taller than ~25% of the viewport; dialogs scroll.

### C. shadcn / Radix component behavior

- [ ] **Dialog**: fits 320px (`max-h-[90dvh] overflow-y-auto`, `w-[calc(100%-2rem)]`); consider Sheet/Drawer-style bottom sheet on mobile.
- [ ] **Sheet / mobile nav**: opens from the correct side in RTL (`side="start"` pattern or flip via `dir`); closes on route change and on resize to desktop.
- [ ] **DropdownMenu / Popover / Select / Combobox**: stays inside the viewport (Radix collision handling works; verify `collisionPadding`), and long lists scroll.
- [ ] **Tabs**: overflow scrolls horizontally or converts to a select on mobile.
- [ ] **Table**: wrapped in `overflow-x-auto` or switches to stacked cards below `md`; sticky first column if needed.
- [ ] **Card grids**: equal heights, consistent padding, images keep aspect ratio (`aspect-video`, `object-cover`).
- [ ] **Buttons**: min 44px height on touch; button groups wrap or go full-width on mobile (`w-full sm:w-auto`).
- [ ] **Sonner toasts**: not overlapping bottom nav / primary CTA; width fits 320px; position respects RTL.
- [ ] **Tooltip**: hover-only content has a touch alternative.
- [ ] **Skeleton / loading states** match the final layout size (no layout shift).

### D. Forms (react-hook-form + zod)

- [ ] Fields stack on mobile, 2-column on `md+` where sensible; labels never overlap inputs.
- [ ] Validation errors appear without shifting buttons off-screen; messages wrap.
- [ ] Inputs use correct `type`/`inputMode`/`autoComplete`; font size >= 16px on mobile.
- [ ] Submit button reachable with the on-screen keyboard open (not hidden behind a fixed footer).
- [ ] Clerk `<SignIn/>`/`<SignUp/>`/`<UserButton/>` fit 320px; Clerk `appearance` uses the same theme tokens; localization applied.

### E. Internationalization and RTL (next-intl)

- [ ] `<html lang dir>` set from locale; `dir="rtl"` flips layout, padding, icons, sliders, and animations.
- [ ] Only logical utilities (`ms-/me-/ps-/pe-/start-/end-`) used.
- [ ] Longest translation (German/Arabic/Russian) does not break buttons, tabs, nav, or table headers.
- [ ] Numbers, dates (`date-fns` locale), and currency format per locale; mixed LTR/RTL text uses `dir="auto"` or `<bdi>` where user content appears.
- [ ] Fonts support both scripts (Arabic and Latin) with matching visual weight; Arabic usually needs slightly larger size and taller `leading-*` than English.
- [ ] Clerk uses the matching localization (`@clerk/localizations`: `arSA` for `ar`, `enUS` for `en`) and flips correctly in RTL.
- [ ] Switching language keeps the user on the same page and scroll position, and the language switcher itself fits 320px in both directions.
- [ ] Arabic text is not letter-spaced (`tracking-*` breaks Arabic joining); avoid `uppercase`/`italic` on Arabic.
- [ ] Numerals follow one convention (Western or Arabic-Indic) consistently across the app.

### F. Theme (next-themes)

- [ ] Light, dark, and system modes all legible at every width; contrast >= 4.5:1 for text.
- [ ] No flash of wrong theme (`suppressHydrationWarning` on `<html>`, `ThemeProvider` set correctly).
- [ ] Images/logos have dark variants or neutral backgrounds; borders and shadows visible in dark.

### G. Images and media (next/image + Cloudinary)

- [ ] Every `Image` has `sizes` such as `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw`.
- [ ] Cloudinary URLs use auto format/quality (`f_auto,q_auto`) and sized transforms, not original uploads.
- [ ] Aspect ratio reserved (no CLS); `priority` only on the LCP image.
- [ ] Video/iframes use `aspect-video w-full`.

### H. Accessibility tied to responsiveness

- [ ] Works at 200% zoom and 400% zoom at 320 CSS px (WCAG reflow).
- [ ] Focus visible, focus order matches visual order (also in RTL and after reflow).
- [ ] Mobile menu traps focus, closes on Esc, restores focus.
- [ ] `prefers-reduced-motion` respected (`motion-reduce:transition-none motion-reduce:animate-none`).
- [ ] Touch targets >= 44x44, spacing >= 8px between them.

### I. Performance sanity on small devices

- [ ] No layout shift when fonts/images/Clerk load; no heavy components rendered but hidden (`hidden md:block` still mounts). Use conditional rendering or dynamic import for desktop-only widgets.
- [ ] Client components are limited to interactive parts; shared layout stays a server component.

## Fix rules

1. Mobile-first: base classes = phone, add `sm: md: lg: xl: 2xl:` upward.
2. Fix at the shared component level (`components/ui`, layout, `PageContainer`), then verify pages.
3. Use one container primitive for page width and padding everywhere, for example:
   `mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8`.
4. Prefer intrinsic layouts (`grid` with `minmax`, `flex-wrap`, `clamp()`) over many breakpoint overrides; fewer breakpoints = smoother continuity.
5. Replace physical with logical utilities (see Static checks).
6. Use theme tokens only; extend tokens in `@theme` inside `globals.css` (Tailwind 4), not inline hex values.
7. Use `cn()` and `cva` variants for responsive variants; do not duplicate components per breakpoint.
8. Never "fix" overflow with `overflow-x-hidden` on `body`; find the offending element (the script prints candidates).
9. Do not disable zoom, and do not hide content to make it fit.
10. Keep changes minimal and consistent with existing code style; run `npm run format`.

## Report template

Produce this after testing:

```
## Responsive Test Report
Routes tested: ...
Viewports: 320, 375, 430, 640, 768, 1024, 1280, 1536, 1920, 2560 (+ boundary widths)
Variants: LTR/RTL x light/dark

### Result: PASS | PASS WITH ISSUES | FAIL

### Issues found
| # | Severity | Route | Viewport(s) | Variant | Problem | Fix applied / proposed |
|---|----------|-------|-------------|---------|---------|------------------------|

### Cohesion notes
- Breakpoint jumps observed: ...
- Inconsistencies in spacing/type/radius: ...

### Verification
- typecheck: ok/fail   lint: ok/fail   format:check: ok/fail
- Screenshots: responsive-report/
```

Severity: **Critical** = content unreachable or page scrolls sideways; **High** = broken layout/RTL/dark unreadable; **Medium** = inconsistency or small tap targets; **Low** = polish.

## Ground rules for Copilot

- Do not claim a screen "looks fine" without having run the checks or viewed screenshots; if the app cannot be run, say so and limit the report to the static scan.
- Ask before adding dependencies or committing test scripts.
- When creating new UI, apply these checklists proactively before finishing the task.