import type { LocalizedText } from "@/types/category";

export type StorefrontImage = { url: string; alt: LocalizedText };

export type StorefrontVariant = {
  id: string;
  sku: string;
  size: string;
  color: { name: LocalizedText; hex: string };
  stock: number;
  price: number;
  compareAtPrice: number | null;
  images: StorefrontImage[];
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  category: { id: string; slug: string; name: LocalizedText } | null;
  images: StorefrontImage[];
  variants: StorefrontVariant[];
  isNew: boolean;
};
