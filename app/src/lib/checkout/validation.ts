import { z } from "zod";

export const shippingFees = {
  west_bank: 20,
  jerusalem: 30,
  inside_48: 70,
} as const;

const requiredText = (max: number) => z.string().trim().min(1).max(max);

export const checkoutSchema = z.strictObject({
  customerName: requiredText(120),
  phone: requiredText(25).regex(/^\+?[0-9][0-9 ()-]{5,23}[0-9]$/),
  region: z.enum(["west_bank", "jerusalem", "inside_48"]),
  city: requiredText(120),
  address: requiredText(500),
  notes: z.string().trim().max(1000).default(""),
});

export const idempotencyKeySchema = z
  .string()
  .regex(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i);

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export function shippingFeeFor(region: CheckoutInput["region"]) {
  return shippingFees[region];
}

export function priceInCents(price: number): number | null {
  const cents = Math.round(price * 100);
  return Number.isFinite(price) &&
    price >= 0 &&
    Number.isSafeInteger(cents) &&
    Math.abs(price * 100 - cents) < 0.000001
    ? cents
    : null;
}
