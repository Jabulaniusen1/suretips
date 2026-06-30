import type { Metadata } from "next";
import { Mail, Send } from "lucide-react";
import { getSiteConfig } from "@/lib/data/site-config";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const config = await getSiteConfig();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        Have a question about a package, payment, or prediction? Reach out below.
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ContactForm />
        <div className="space-y-3">
          <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 text-sm hover:text-brand">
            <Mail className="size-4" /> {config.contact_email}
          </a>
          <a href={config.telegram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-brand">
            <Send className="size-4" /> Telegram channel
          </a>
        </div>
      </div>
    </div>
  );
}
