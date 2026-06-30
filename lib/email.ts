import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const client = getTransporter();
  if (!client) {
    console.warn(`SMTP not configured — skipping email "${subject}" to ${to}`);
    return;
  }

  await client.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to, subject, html });
}
