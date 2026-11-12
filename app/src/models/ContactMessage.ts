import mongoose, { Schema, type InferSchemaType } from "mongoose";

const contactMessageSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    submissionKey: { type: String, required: true, unique: true },
    status: { type: String, enum: ["new", "handled"], default: "new" },
  },
  { timestamps: true, collection: "contact_messages" },
);
contactMessageSchema.index({ createdAt: -1 });

export type IContactMessage = InferSchemaType<typeof contactMessageSchema>;
export const ContactMessage =
  (mongoose.models.ContactMessage as mongoose.Model<IContactMessage> | undefined) ??
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
