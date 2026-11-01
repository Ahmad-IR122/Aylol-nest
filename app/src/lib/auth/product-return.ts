// Only store paths in the current locale may be used after Clerk sign-in.
export function productReturnPath(locale: string, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^\/(ar|en)\/(?:cart|products\/[a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(value);
  return match?.[1] === locale ? value : null;
}
