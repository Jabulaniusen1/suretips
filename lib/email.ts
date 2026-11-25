import "server-only";
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Returns false when SMTP is not configured -- callers must not report success. */
export async function sendEmail(options: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    console.warn(`[email] SMTP not configured — could not send "${options.subject}"`);
    return false;
  }
  await client.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  });
  return true;
}
