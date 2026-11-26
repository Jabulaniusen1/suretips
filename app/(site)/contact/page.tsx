import type { Metadata } from "next";
import { Headset, Mail, MessageCircle, Send } from "lucide-react";
import { InlineContent, PlainContent } from "@/components/content/plain-content";
import { getSiteText } from "@/lib/content/site-text";
import { getSiteConfig } from "@/lib/data/site-config";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const text = await getSiteText();
  return pageMetadata({ title: text.t("contact.seoTitle"), description: text.t("contact.seoDescription"), path: "/contact" });
}

// Contact is by email only. The address comes from Admin > Links & Contact;
// the wording from Admin > Site Content > Contact page.
export default async function ContactPage() {
  const [config, text] = await Promise.all([getSiteConfig(), getSiteText()]);
  const intro = text.t("contact.intro");
  const noEmail = text.t("contact.noEmail");
  const email = config.contact_email.trim();
  const whatsappDigits = config.whatsapp_number.replace(/\D/g, "");
  const hasOtherLinks = Boolean(config.telegram_url || whatsappDigits.length >= 7 || config.support_link);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: text.t("contact.breadcrumb"), path: "/contact" }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        <InlineContent text={text.t("contact.h1")} />
      </h1>
      {intro && <PlainContent text={intro} className="mt-3 max-w-2xl text-muted-foreground" />}

      <div className="mt-8 max-w-xl">
        {email ? (
          <a
            href={`mailto:${email}`}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Mail aria-hidden className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-muted-foreground">{text.t("contact.emailLabel")}</span>
              <span className="block break-all text-lg font-bold group-hover:text-brand">{email}</span>
            </span>
          </a>
        ) : (
          noEmail && <PlainContent text={noEmail} className="text-muted-foreground" />
        )}

        {hasOtherLinks && (
          <div className="mt-6 space-y-3 text-sm">
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
        )}
      </div>
    </div>
  );
}
