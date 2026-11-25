import type { Metadata } from "next";
import { Headset, Mail, Send } from "lucide-react";
import { getSiteConfig } from "@/lib/data/site-config";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ContactForm } from "@/components/site/contact-form";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: "Contact Sure Match Tips with questions about a prediction or result, to report a mistake, or for general enquiries.",
  path: "/contact",
});

export default async function ContactPage() {
  const config = await getSiteConfig();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Contact Us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Questions about a prediction, a result you think was graded wrongly, or anything else on the site — send us a message.
        We read everything. Please don&apos;t send betting slips or payment details: we never take bets or payments.
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ContactForm />
        <div className="space-y-3 text-sm">
          {config.contact_email && (
            <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 hover:text-brand">
              <Mail aria-hidden className="size-4" /> {config.contact_email}
            </a>
          )}
          {config.telegram_url && (
            <a href={config.telegram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand">
              <Send aria-hidden className="size-4" /> Telegram channel
            </a>
          )}
          {config.support_link && (
            <a href={config.support_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand">
              <Headset aria-hidden className="size-4" /> Chat with support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
