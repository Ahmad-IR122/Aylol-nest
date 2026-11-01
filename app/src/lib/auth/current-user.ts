import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  await connectDB();

  const user = await User.findOne({
    clerkId: userId,
    isActive: true,
  }).lean();

  return user;
}

export async function getCurrentCartUser() {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  const existing = await User.findOne({ clerkId: userId }).lean();
  if (existing) return existing.isActive ? existing : null;

  // A new Clerk session can arrive before the user.created webhook.
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || clerkUser.id !== userId || !email) return null;

  try {
    await User.updateOne(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          firstName: clerkUser.firstName ?? "",
          lastName: clerkUser.lastName ?? "",
          email,
          imageUrl: clerkUser.imageUrl ?? "",
          role: "customer",
          isActive: true,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000))
      throw error;
  }
  const user = await User.findOne({ clerkId: userId }).lean();
  return user?.isActive ? user : null;
}
