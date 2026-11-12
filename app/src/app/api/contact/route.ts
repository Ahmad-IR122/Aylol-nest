import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/contact/validation";
import { ContactMessage } from "@/models/ContactMessage";
import { ContactRateLimit } from "@/models/ContactRateLimit";

export const runtime = "nodejs";

async function readBodyText(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  let submittedKey: string | null = null;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json({ code: "invalidRequest" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ code: "invalidRequest" }, { status: 415 });

  try {
    const body = await readBodyText(request, 24_000);
    if (body === null || body.length > 8000)
      return NextResponse.json({ code: "invalidRequest" }, { status: 413 });
    const parsed = contactSchema.safeParse(JSON.parse(body));
    if (!parsed.success) {
      const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
      return NextResponse.json({ code: "invalidFields", fields }, { status: 400 });
    }
    const { website, submissionKey, ...message } = parsed.data;
    submittedKey = submissionKey;
    if (website) return NextResponse.json({ ok: true });

    const { connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    await Promise.all([ContactMessage.init(), ContactRateLimit.init()]);
    if (await ContactMessage.exists({ submissionKey })) return NextResponse.json({ ok: true });

    // The nearest proxy address is used when forwarding headers are present.
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const window = Math.floor(Date.now() / 600_000);
    const key = createHash("sha256").update(`${ip}:${window}`).digest("hex");
    const bucket = await ContactRateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 1) * 600_000 + 60_000) },
      },
      { upsert: true, new: true },
    );
    if (bucket.count > 5) return NextResponse.json({ code: "rateLimited" }, { status: 429 });

    await ContactMessage.create({ ...message, submissionKey });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000 &&
      submittedKey &&
      (await ContactMessage.exists({ submissionKey: submittedKey }))
    )
      return NextResponse.json({ ok: true });
    if (error instanceof SyntaxError)
      return NextResponse.json({ code: "invalidRequest" }, { status: 400 });
    console.error(
      "Contact submission failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json({ code: "serverError" }, { status: 503 });
  }
}
