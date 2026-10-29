import mongoose, { Schema, type InferSchemaType } from "mongoose";

const cartLineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  },
  { timestamps: true },
);

const cartSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [cartLineSchema], default: [] },
    revision: { type: Number, default: 0, required: true },
  },
  { timestamps: true, collection: "carts" },
);

cartSchema.index({ owner: 1 }, { unique: true });

export type ICart = InferSchemaType<typeof cartSchema>;
export const Cart =
  (mongoose.models.Cart as mongoose.Model<ICart> | undefined) ??
  mongoose.model<ICart>("Cart", cartSchema);
