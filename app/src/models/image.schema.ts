
import { Schema } from "mongoose";

export const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
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
  },
  { _id: false },
);
