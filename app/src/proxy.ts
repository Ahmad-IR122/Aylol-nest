import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default clerkMiddleware(async (_auth, request) => {
  return handleI18nRouting(request);
});

export const config = {
  matcher: [
    // Apply middleware to pages, excluding Next.js internals and static files
    "/((?!_next|.*\\..*).*)",

    // Apply Clerk middleware to API routes
    "/(api|trpc)(.*)",
  ],
};
