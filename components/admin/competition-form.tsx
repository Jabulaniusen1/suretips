"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createCompetition, updateCompetition } from "@/lib/actions/client";
import type { Tables } from "@/types/database";

const numberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export function CompetitionForm({ competition, onSaved }: { competition?: Tables<"competitions">; onSaved?: () => void }) {
  const [name, setName] = useState(competition?.name ?? "");
  const [slug, setSlug] = useState(competition?.slug ?? "");
  const [leagueId, setLeagueId] = useState(competition?.league_id?.toString() ?? "");
  const [country, setCountry] = useState(competition?.country ?? "");
  const [type, setType] = useState(competition?.competition_type ?? "league");
  const [season, setSeason] = useState(competition?.current_season?.toString() ?? "");
  const [order, setOrder] = useState(competition?.display_order?.toString() ?? "0");
  const [heading, setHeading] = useState(competition?.heading ?? "");
  const [subheading, setSubheading] = useState(competition?.subheading ?? "");
  const [introduction, setIntroduction] = useState(competition?.introduction ?? "");
  const [mainContent, setMainContent] = useState(competition?.main_content ?? "");
  const [seoTitle, setSeoTitle] = useState(competition?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(competition?.seo_description ?? "");
  const [ogImage, setOgImage] = useState(competition?.og_image ?? "");
  const [isActive, setIsActive] = useState(competition?.status !== "inactive");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const input = {
        name,
        slug,
        league_id: numberOrNull(leagueId),
        status: (isActive ? "active" : "inactive") as Tables<"competitions">["status"],
        heading,
        subheading,
        introduction,
        main_content: mainContent,
        seo_title: seoTitle,
        seo_description: seoDescription,
        country,
        competition_type: type === "cup" ? ("cup" as const) : ("league" as const),
        current_season: numberOrNull(season),
        display_order: Number(order) || 0,
        og_image: ogImage,
      };
      if (competition) await updateCompetition(competition.id, input);
      else await createCompetition(input);
      toast.success("Saved");
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-slug">Slug (/competitions/…)</Label>
          <Input id="c-slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="c-league">API-Sports league ID</Label>
          <Input id="c-league" type="number" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-country">Country / region</Label>
          <Input id="c-country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-type">Type</Label>
          <select id="c-type" value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option value="league">League</option>
            <option value="cup">Cup / tournament</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-season">Season (blank = auto)</Label>
          <Input id="c-season" type="number" value={season} onChange={(e) => setSeason(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="c-seo-title">SEO title</Label>
          <Input id="c-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-order">Display order</Label>
          <Input id="c-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-seo-desc">Meta description</Label>
        <Textarea id="c-seo-desc" rows={2} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-heading">H1 heading</Label>
        <Input id="c-heading" placeholder={`${name || "Competition"} Predictions`} value={heading} onChange={(e) => setHeading(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-sub">Subheading</Label>
        <Input id="c-sub" value={subheading} onChange={(e) => setSubheading(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-intro">Introduction (200+ characters needed for indexing when no picks are published)</Label>
        <Textarea id="c-intro" rows={4} value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-body">Additional content (plain text: blank line = paragraph, “## ” sub-heading, “- ” bullet, **bold**, [link](/path))</Label>
        <Textarea id="c-body" rows={6} value={mainContent} onChange={(e) => setMainContent(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-og">Social image URL (optional)</Label>
        <Input id="c-og" placeholder="https://…" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="c-active">Active</Label>
        <Switch id="c-active" checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save competition"}
      </Button>
    </div>
  );
}
