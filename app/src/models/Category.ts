import mongoose, { Schema, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
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

    imageUrl: {
      type: String,
      default: "",
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "categories",
  },
);


categorySchema.index({ parent: 1, sortOrder: 1 });
categorySchema.index({ isActive: 1 });

export type ICategory = InferSchemaType<typeof categorySchema>;

export const Category =
  (mongoose.models.Category as mongoose.Model<ICategory> | undefined) ??
  mongoose.model<ICategory>("Category", categorySchema);