// Set these in the deployment environment after verifying the business details.
// Unset values are intentionally hidden from public pages.
export const contactConfig = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || null,
  whatsapp: process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || null,
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || null,
  instagram: process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM || null,
  facebook: process.env.NEXT_PUBLIC_CONTACT_FACEBOOK || null,
  tiktok: process.env.NEXT_PUBLIC_CONTACT_TIKTOK || null,
} as const;
