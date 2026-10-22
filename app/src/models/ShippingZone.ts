import mongoose, { Schema, type InferSchemaType } from "mongoose";

const shippingZoneSchema = new Schema(
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

    cities: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (cities: string[]) => cities.length > 0,
        message: "Shipping zone must contain at least one city",
      },
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },

    freeShippingThreshold: {
      type: Number,
      min: 0,
      default: null,
    },

    estimatedDeliveryDays: {
      min: {
        type: Number,
        required: true,
        min: 0,
      },
      max: {
        type: Number,
        required: true,
        min: 0,
      },
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
    collection: "shipping_zones",
  },
);

shippingZoneSchema.path("estimatedDeliveryDays").validate(function (value: {
  min: number;
  max: number;
}) {
  return Number.isInteger(value.min) && Number.isInteger(value.max) && value.max >= value.min;
}, "Maximum delivery days must be greater than or equal to minimum delivery days");

shippingZoneSchema.index({ isActive: 1, sortOrder: 1 });

export type IShippingZone = InferSchemaType<typeof shippingZoneSchema>;

export const ShippingZone =
  (mongoose.models.ShippingZone as mongoose.Model<IShippingZone> | undefined) ??
  mongoose.model<IShippingZone>("ShippingZone", shippingZoneSchema);
