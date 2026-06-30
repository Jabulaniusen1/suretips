"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createCompetition, updateCompetition } from "@/lib/actions/admin/competitions";
import type { Tables } from "@/types/database";

export function CompetitionForm({ competition, onSaved }: { competition?: Tables<"competitions">; onSaved?: () => void }) {
  const [name, setName] = useState(competition?.name ?? "");
  const [slug, setSlug] = useState(competition?.slug ?? "");
  const [leagueId, setLeagueId] = useState(competition?.league_id?.toString() ?? "");
  const [heading, setHeading] = useState(competition?.heading ?? "");
  const [subheading, setSubheading] = useState(competition?.subheading ?? "");
  const [introduction, setIntroduction] = useState(competition?.introduction ?? "");
  const [isActive, setIsActive] = useState(competition?.status !== "inactive");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!name || !slug) return toast.error("Name and slug are required");
    setSubmitting(true);
    try {
      const input = {
        name,
        slug,
        league_id: leagueId ? Number(leagueId) : undefined,
        status: (isActive ? "active" : "inactive") as Tables<"competitions">["status"],
        heading,
        subheading,
        introduction,
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>API-Sports League ID</Label>
        <Input type="number" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Subheading</Label>
        <Input value={subheading} onChange={(e) => setSubheading(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Introduction</Label>
        <Textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save Competition"}
      </Button>
    </div>
  );
}
