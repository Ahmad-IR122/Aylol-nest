
export type LocalizedText = {
  ar: string;
  en: string;
};

export type Category = {
  _id: string;
  name: LocalizedText;
  slug: string;
  description?: Partial<LocalizedText>;
  imageUrl?: string;
  parent?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryManagerProps = {
  locale: string;
};

export type CategoryForm = {
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  parent: string;
  sortOrder: string;
  isActive: boolean;
};
