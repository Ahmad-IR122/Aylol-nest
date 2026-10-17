import "server-only";

import { getCurrentUser } from "./current-user";

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "ForbiddenError";
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthorizedError();
  }
  if (user.role !== "admin") {
    throw new ForbiddenError();
  }
  return user;
}
