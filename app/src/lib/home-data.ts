export type HomeLocale = "ar" | "en";

export type HomeProduct = {
  id: string;
  name: {
    ar: string;
    en: string;
  };
  category: "girls" | "boys" | "baby";
  price: number;
  image: string | null;
  isNew?: boolean;
};

export const homeProducts: HomeProduct[] = [
  {
    id: "demo-1",
    name: {
      ar: "فستان أطفال ناعم",
      en: "Soft Girls Dress",
    },
    category: "girls",
    price: 95,
    image: null,
    isNew: true,
  },
  {
    id: "demo-2",
    name: {
      ar: "طقم أولاد قطني",
      en: "Cotton Boys Set",
    },
    category: "boys",
    price: 110,
    image: null,
  },
  {
    id: "demo-3",
    name: {
      ar: "طقم مواليد مريح",
      en: "Cozy Baby Outfit",
    },
    category: "baby",
    price: 75,
    image: null,
    isNew: true,
  },
  {
    id: "demo-4",
    name: {
      ar: "جاكيت أطفال خفيف",
      en: "Lightweight Kids Jacket",
    },
    category: "boys",
    price: 135,
    image: null,
  },
  {
    id: "demo-5",
    name: {
      ar: "طقم بنات أنيق",
      en: "Elegant Girls Set",
    },
    category: "girls",
    price: 120,
    image: null,
    isNew: true,
  },
  {
    id: "demo-6",
    name: {
      ar: "بيجامة مواليد قطنية",
      en: "Cotton Baby Pajamas",
    },
    category: "baby",
    price: 65,
    image: null,
    isNew: true,
  },
];

export const homeCopy = {
  ar: {
    categoriesEyebrow: "اكتشف مجموعاتنا",
    categoriesTitle: "تسوق حسب الفئة",
    categoriesDescription: "اختيارات جميلة تناسب كل مرحلة من طفولتهم.",
    girls: "بنات",
    boys: "أولاد",
    baby: "مواليد",
    categoryAction: "اكتشف المجموعة",
    featuredEyebrow: "مختارة بعناية",
    featuredTitle: "منتجات مميزة",
    featuredDescription: "قطع ناعمة وأنيقة لصغاركم.",
    arrivalsEyebrow: "جديد أيلول",
    arrivalsTitle: "وصل حديثًا",
    arrivalsDescription: "اكتشف أحدث الإضافات إلى مجموعتنا.",
    viewAll: "عرض جميع المنتجات",
    newBadge: "جديد",
    currency: "₪",
    imagePlaceholder: "صورة المنتج قريبًا",
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
    featuredEyebrow: "THOUGHTFULLY SELECTED",
    featuredTitle: "Featured Products",
    featuredDescription: "Soft, stylish pieces for your little ones.",
    arrivalsEyebrow: "FRESH AT AYLOL",
    arrivalsTitle: "New Arrivals",
    arrivalsDescription: "Discover the latest additions to our collection.",
    viewAll: "View All Products",
    newBadge: "New",
    currency: "₪",
    imagePlaceholder: "Product photo coming soon",
    bannerEyebrow: "AYLOL NEST COLLECTION",
    bannerTitle: "Little Details, Big Memories",
    bannerDescription: "Comfortable, beautiful clothing for their sweetest moments.",
    bannerAction: "Explore Collection",
  },
} as const;
