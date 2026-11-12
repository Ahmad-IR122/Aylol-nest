import { z } from "zod";

const clean = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value));

export const contactSchema = z.strictObject({
  fullName: clean(120),
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9 ()-]{5,23}[0-9]$/),
  ]),
  subject: clean(150),
  message: z
    .string()
    .trim()
    .min(10)
    .max(3000)
    .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)),
  website: z.string().max(200).default(""),
  submissionKey: z.uuid(),
});

export type ContactInput = z.input<typeof contactSchema>;
