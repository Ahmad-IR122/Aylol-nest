import mongoose, { Schema, type InferSchemaType } from "mongoose";

import { imageSchema } from "./image.schema";

const productVariantSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      name: {
        ar: {
          type: String,
          required: true,
          trim: true,
        },
        en: {
          type: String,
          required: true,
          trim: true,
        },
      },
      hex: {
        type: String,
        required: true,
        default: "",
      },
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    images: {
      type: [imageSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const productSchema = new Schema(
  {
    name: {
      ar: {
        type: String,
        required: true,
        trim: true,
      },
      en: {
        type: String,
        required: true,
        trim: true,
      },
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      ar: {
        type: String,
        trim: true,
        default: "",
      },
      en: {
        type: String,
        trim: true,
        default: "",
      },
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    images: {
      type: [imageSchema],
      default: [],
    },

    variants: {
      type: [productVariantSchema],
      required: true,
      validate: {
        validator: (variants: unknown[]) => variants.length > 0,
        message: "Product must have at least one variant",
      },
    },

    gender: {
      type: String,
      enum: ["boys", "girls", "unisex"],
      required: true,
    },

    ageGroup: {
      type: String,
      enum: ["newborn", "baby", "toddler", "kids"],
      required: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isNewArrival: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "products",
  },
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ isNewArrival: 1, isActive: 1 });
productSchema.index({ "variants.sku": 1 });

export type IProduct = InferSchemaType<typeof productSchema>;
export type IProductVariant = InferSchemaType<typeof productVariantSchema>;

export const Product =
  (mongoose.models.Product as mongoose.Model<IProduct> | undefined) ??
  mongoose.model<IProduct>("Product", productSchema);
