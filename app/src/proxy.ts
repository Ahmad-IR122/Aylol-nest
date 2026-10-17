import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default clerkMiddleware(async (_auth, request) => {
  // API routes should not be handled by next-intl
  if (request.nextUrl.pathname.startsWith("/api/") || request.nextUrl.pathname === "/api") {
    return;
  }

  return handleI18nRouting(request);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
