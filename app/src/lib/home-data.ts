import type { LocalizedText } from "@/types/category";

export type HomeLocale = "ar" | "en";

export type HomeProduct = {
  id: string;
  slug: string;
  name: LocalizedText;
  category: LocalizedText | null;
  price: number | null;
  maxPrice: number | null;
  image: string | null;
  imageAlt: LocalizedText;
  inStock: boolean;
  isNew?: boolean;
};

export const homeCopy = {
  ar: {
    categoriesEyebrow: "اكتشف مجموعاتنا",
    categoriesTitle: "تسوق حسب الفئة",
    categoriesDescription: "اختيارات جميلة تناسب كل مرحلة من طفولتهم.",
    girls: "بنات",
    boys: "أولاد",
    baby: "مواليد",
    categoryAction: "اكتشف المجموعة",
    bannerEyebrow: "AYLOL NEST COLLECTION",
    bannerTitle: "تفاصيل صغيرة، وذكريات كبيرة",
    bannerDescription: "ملابس مريحة وأنيقة ترافق أطفالكم في أجمل لحظاتهم.",
    bannerAction: "اكتشف التشكيلة",
  },
  en: {
    categoriesEyebrow: "EXPLORE OUR COLLECTIONS",
    categoriesTitle: "Shop by Category",
    categoriesDescription: "Lovely choices for every stage of childhood.",
    girls: "Girls",
    boys: "Boys",
    baby: "Newborn",
    categoryAction: "Explore Collection",
    bannerEyebrow: "AYLOL NEST COLLECTION",
    bannerTitle: "Little Details, Big Memories",
    bannerDescription: "Comfortable, beautiful clothing for their sweetest moments.",
    bannerAction: "Explore Collection",
  },
} as const;
