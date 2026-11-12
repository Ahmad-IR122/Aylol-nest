import mongoose, { Schema, type InferSchemaType } from "mongoose";

const contactRateLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: "contact_rate_limits" },
);
contactRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IContactRateLimit = InferSchemaType<typeof contactRateLimitSchema>;
export const ContactRateLimit =
  (mongoose.models.ContactRateLimit as mongoose.Model<IContactRateLimit> | undefined) ??
  mongoose.model<IContactRateLimit>("ContactRateLimit", contactRateLimitSchema);
