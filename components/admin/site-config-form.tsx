"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteConfig } from "@/lib/actions/admin/config";
import type { SiteConfig } from "@/lib/data/site-config";

export function SiteConfigForm({ config }: { config: SiteConfig }) {
  const [hero, setHero] = useState(config.hero);
  const [telegram, setTelegram] = useState(config.telegram_url);
  const [whatsapp, setWhatsapp] = useState(config.whatsapp_number);
  const [contactEmail, setContactEmail] = useState(config.contact_email);
  const [social, setSocial] = useState(config.social_links);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      await Promise.all([
        updateSiteConfig("hero", hero),
        updateSiteConfig("telegram_url", telegram),
        updateSiteConfig("whatsapp_number", whatsapp),
        updateSiteConfig("contact_email", contactEmail),
        updateSiteConfig("social_links", social),
      ]);
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
        <h2 className="font-bold">Hero Section</h2>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Subtext</Label>
          <Textarea value={hero.subtext} onChange={(e) => setHero({ ...hero, subtext: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary CTA Label</Label>
            <Input value={hero.primary_cta_label} onChange={(e) => setHero({ ...hero, primary_cta_label: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Secondary CTA Label</Label>
            <Input value={hero.secondary_cta_label} onChange={(e) => setHero({ ...hero, secondary_cta_label: e.target.value })} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">Contact & Socials</h2>
        <div className="space-y-2">
          <Label>Telegram URL</Label>
          <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp Number</Label>
          <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contact Email</Label>
          <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input value={social.facebook ?? ""} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Twitter / X</Label>
            <Input value={social.twitter ?? ""} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={social.instagram ?? ""} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>YouTube</Label>
            <Input value={social.youtube ?? ""} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} />
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save Config"}
      </Button>
    </div>
  );
}
