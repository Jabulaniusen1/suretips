import { NextResponse } from "next/server";
import { z } from "zod";
import { getSiteConfig } from "@/lib/data/site-config";
import { escapeHtml, sendEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10, "Please write a little more").max(5000),
  // Honeypot: real users never see or fill this field.
  // (Accepted here and checked below, so bots get a fake success, not an error.)
  website: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(`contact:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check the form" }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ ok: true }); // bot: pretend success

  const config = await getSiteConfig();
  const to = config.contact_email || process.env.CONTACT_FORM_TO || "";
  if (!to) {
    return NextResponse.json({ error: "The contact form isn't available right now. Please reach us on our social channels." }, { status: 503 });
  }

  const { name, email, message } = parsed.data;
  try {
    const sent = await sendEmail({
      to,
      replyTo: email,
      subject: `Contact form: ${name.slice(0, 60)}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });
    if (!sent) {
      return NextResponse.json({ error: "The contact form isn't available right now. Please try again later." }, { status: 503 });
    }
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json({ error: "We couldn't send your message. Please try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
