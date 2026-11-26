import type { Metadata } from "next";
import { Headset, Mail, MessageCircle, Send } from "lucide-react";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import { getSiteConfig } from "@/lib/data/site-config";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ContactForm } from "@/components/site/contact-form";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const text = await getSiteText();
  return pageMetadata({ title: text.t("contact.seoTitle"), description: text.t("contact.seoDescription"), path: "/contact" });
}

export default async function ContactPage() {
  const [config, text] = await Promise.all([getSiteConfig(), getSiteText()]);
  const intro = text.t("contact.intro");
  const whatsappDigits = config.whatsapp_number.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("contact.breadcrumb"), path: "/contact" }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        <InlineContent text={text.t("contact.h1")} />
      </h1>
      {intro && <PlainContent text={intro} className="mt-3 max-w-2xl text-muted-foreground" />}
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ContactForm
          labels={{
            name: text.t("contact.formName"),
            email: text.t("contact.formEmail"),
            message: text.t("contact.formMessage"),
            send: text.t("contact.formSend"),
            sending: text.t("contact.formSending"),
            success: text.t("contact.formSuccess"),
          }}
        />
        <div className="space-y-3 text-sm">
          {config.contact_email && (
            <a href={`mailto:${config.contact_email}`} className="flex items-center gap-2 hover:text-brand">
              <Mail aria-hidden className="size-4" /> {config.contact_email}
            </a>
          )}
          {config.telegram_url && (
            <a href={config.telegram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand">
              <Send aria-hidden className="size-4" /> {text.t("contact.telegram")}
            </a>
          )}
          {whatsappDigits.length >= 7 && (
            <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand">
              <MessageCircle aria-hidden className="size-4" /> {text.t("contact.whatsapp")}
            </a>
          )}
          {config.support_link && (
            <a href={config.support_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-brand">
              <Headset aria-hidden className="size-4" /> {text.t("contact.support")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
