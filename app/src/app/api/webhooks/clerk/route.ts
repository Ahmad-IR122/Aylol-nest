import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, NextRequest } from "next/server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const clerkUser = event.data;

      const primaryEmail = clerkUser.email_addresses.find(
        (email) => email.id === clerkUser.primary_email_address_id,
      );

      await connectDB();

      await User.updateOne(
        { clerkId: clerkUser.id },
        {
          $set: {
            firstName: clerkUser.first_name ?? "",
            lastName: clerkUser.last_name ?? "",
            email: primaryEmail?.email_address ?? "",
            imageUrl: clerkUser.image_url ?? "",
          },
          $setOnInsert: {
            clerkId: clerkUser.id,
            role: "customer",
            isActive: true,
          },
        },
        { upsert: true },
      );
    }

    if (event.type === "user.deleted" && event.data.id) {
      await connectDB();

      await User.updateOne({ clerkId: event.data.id }, { $set: { isActive: false } });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Clerk webhook processing failed:", error);

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
