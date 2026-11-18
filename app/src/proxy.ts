import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default clerkMiddleware(async (_auth, request) => {
  const { pathname } = request.nextUrl;
  // Keep API and public-file URLs intact while still providing Clerk context on errors.
  if (
    /^\/(?:api|trpc|images|\.well-known)(?:\/|$)/.test(pathname) ||
    /^\/(?:favicon\.ico|icon\.png|(?:file|globe|next|vercel|window)\.svg)$/.test(pathname)
  ) {
    return;
  }

  return handleI18nRouting(request);
});

export const config = {
  // Dotted paths can still resolve to a storefront page or its error layout.
  matcher: "/((?!_next(?:/|$)).*)",
};
