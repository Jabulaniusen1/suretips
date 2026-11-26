"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSiteConfig } from "@/lib/actions/client";
import type { SiteConfig } from "@/lib/data/site-config";

export function SiteConfigForm({ config }: { config: SiteConfig }) {
  const [telegram, setTelegram] = useState(config.telegram_url);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp_number);
  const [contactEmail, setContactEmail] = useState(config.contact_email);
  const [supportLink, setSupportLink] = useState(config.support_link);
  const [social, setSocial] = useState({
    facebook: config.social_links.facebook ?? "",
    twitter: config.social_links.twitter ?? "",
    instagram: config.social_links.instagram ?? "",
    youtube: config.social_links.youtube ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      await saveSiteConfig({
        telegram_url: telegram,
        whatsapp_number: whatsapp,
        contact_email: contactEmail,
        support_link: supportLink,
        social_links: social,
      });
      toast.success("Site config saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="font-bold">Contact &amp; community</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave a field empty to hide it on the site. Only real, working contact details belong here — they appear in the
            footer, on the contact page and in the Organization structured data.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cfg-email">Contact email</Label>
          <Input id="cfg-email" type="email" placeholder="hello@…" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <p className="text-xs text-muted-foreground">Shown on the contact page — visitors reach you by email.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cfg-telegram">Telegram channel URL</Label>
          <Input id="cfg-telegram" placeholder="https://t.me/…" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cfg-whatsapp">WhatsApp number</Label>
          <Input id="cfg-whatsapp" placeholder="+234 …" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cfg-support">Support link</Label>
          <Input id="cfg-support" placeholder="https://wa.me/… or https://t.me/…" value={supportLink} onChange={(e) => setSupportLink(e.target.value)} />
          <p className="text-xs text-muted-foreground">Shown on the contact page as a direct support button.</p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">Social profiles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["facebook", "twitter", "instagram", "youtube"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`cfg-${key}`} className="capitalize">
                {key === "twitter" ? "X / Twitter" : key}
              </Label>
              <Input
                id={`cfg-${key}`}
                placeholder="https://…"
                value={social[key]}
                onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save config"}
      </Button>
    </div>
  );
}
