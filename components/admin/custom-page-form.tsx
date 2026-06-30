"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createCustomPage, updateCustomPage } from "@/lib/actions/admin/custom-pages";
import { FREE_PREDICTIONS_FILTERS } from "@/lib/utils/prediction-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/types/database";

export function CustomPageForm({ page, onSaved }: { page?: Tables<"custom_pages">; onSaved?: () => void }) {
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [heading, setHeading] = useState(page?.heading ?? "");
  const [subheading, setSubheading] = useState(page?.subheading ?? "");
  const [description, setDescription] = useState(page?.description ?? "");
  const [filterId, setFilterId] = useState(page?.filter_id ?? "all");
  const [isPublished, setIsPublished] = useState(page?.is_published ?? true);
  const [showInFooter, setShowInFooter] = useState(page?.show_in_footer ?? false);
  const [footerLabel, setFooterLabel] = useState(page?.footer_label ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!title || !slug) return toast.error("Title and slug are required");
    setSubmitting(true);
    try {
      const input = {
        title,
        slug,
        heading,
        subheading,
        description,
        filter_id: filterId,
        is_published: isPublished,
        show_in_footer: showInFooter,
        footer_label: footerLabel,
      };
      if (page) await updateCustomPage(page.id, input);
      else await createCustomPage(input);
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
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Slug (/tips/...)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
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
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Filter</Label>
        <Select value={filterId} onValueChange={(v) => setFilterId(v ?? "all")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {FREE_PREDICTIONS_FILTERS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Footer Label (if shown in footer)</Label>
        <Input value={footerLabel} onChange={(e) => setFooterLabel(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Show in Footer</Label>
        <Switch checked={showInFooter} onCheckedChange={setShowInFooter} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Published</Label>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save Page"}
      </Button>
    </div>
  );
}
