import mongoose, { Schema, type InferSchemaType } from "mongoose";

// One document keeps the complete ordered selection and its revision atomic.
const exploreSelectionSchema = new Schema(
  {
    _id: { type: String, default: "explore" },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    revision: { type: Number, required: true, default: 0 },
  },
  { collection: "explore_selection", versionKey: false },
);

export type IExploreSelection = InferSchemaType<typeof exploreSelectionSchema>;
export const ExploreSelection =
  (mongoose.models.ExploreSelection as mongoose.Model<IExploreSelection> | undefined) ??
  mongoose.model<IExploreSelection>("ExploreSelection", exploreSelectionSchema);
