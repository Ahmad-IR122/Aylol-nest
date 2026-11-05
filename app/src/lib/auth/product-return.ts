// Only store paths in the current locale may be used after Clerk sign-in.
export function productReturnPath(locale: string, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match =
    /^\/(ar|en)\/(?:cart|checkout(?:\/confirmation\/[a-f\d]{24})?|orders(?:\?page=[1-9]\d{0,5}|\/[a-f\d]{24})?|products\/[a-z0-9]+(?:-[a-z0-9]+)*)$/i.exec(
      value,
    );
  return match?.[1] === locale ? value : null;
}
