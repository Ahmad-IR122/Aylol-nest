import mongoose, { Schema, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    name: {
      ar: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
      en: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
    },

    imageUrl: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      required: true,
      maxlength: 100,
    },

    color: {
      ar: {
        type: String,
        required: true,
        maxlength: 120,
      },
      en: {
        type: String,
        required: true,
        maxlength: 120,
      },
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be a safe integer",
      },
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite,
    },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      match: /^\+?[0-9][0-9 ()-]{5,23}[0-9]$/,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    streetAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    building: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: /^AN-\d{8}-[A-F0-9]{24}$/,
    },

    idempotencyKeyHash: {
      type: String,
      required: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/,
    },

    requestHash: {
      type: String,
      required: true,
      immutable: true,
      match: /^[a-f0-9]{64}$/,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      immutable: true,
      validate: {
        validator: (items: unknown[]) => items.length > 0,
        message: "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    shippingZone: {
      type: Schema.Types.ObjectId,
      ref: "ShippingZone",
    },

    shippingRegion: {
      type: String,
      enum: ["west_bank", "jerusalem", "inside_48"],
      required: true,
      immutable: true,
    },

    shippingZoneName: {
      ar: {
        type: String,
      },
      en: {
        type: String,
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      validate: Number.isFinite,
    },

    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      validate: Number.isFinite,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
      validate: Number.isFinite,
    },

    currency: {
      type: String,
      enum: ["ILS"],
      default: "ILS",
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery"],
      default: "cash_on_delivery",
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      required: true,
    },

    customerNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "orders",
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, idempotencyKeyHash: 1 },
  { unique: true, partialFilterExpression: { idempotencyKeyHash: { $type: "string" } } },
);
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

export type IOrder = InferSchemaType<typeof orderSchema>;

export const Order =
  (mongoose.models.Order as mongoose.Model<IOrder> | undefined) ??
  mongoose.model<IOrder>("Order", orderSchema);
