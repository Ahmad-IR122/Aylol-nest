"use server";

import { revalidatePath } from "next/cache";
import { setContactMessageStatus } from "@/lib/admin/contact";

export async function updateContactStatus(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || (status !== "new" && status !== "handled"))
    throw new Error("Invalid contact update");
  await setContactMessageStatus(id, status);
  revalidatePath("/[locale]/admin/contact", "page");
}
