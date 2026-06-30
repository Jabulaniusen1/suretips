import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/data/site-config";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const config = await getSiteConfig();
  await sendEmail(
    config.contact_email,
    `New contact form message from ${name}`,
    `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`
  );

  return NextResponse.json({ ok: true });
}
