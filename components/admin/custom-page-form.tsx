"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCustomPage, updateCustomPage } from "@/lib/actions/client";
import { MARKET_PAGES, getMarketPage } from "@/lib/seo/market-pages";
import { indexabilityIssues, MIN_INDEXABLE_CONTENT_LENGTH, customPageContentLength } from "@/lib/seo/custom-page-rules";
import type { FaqItem, RelatedLink, Tables } from "@/types/database";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={value.length > max ? "text-destructive" : "text-muted-foreground"}>
      {value.length}/{max}
    </span>
  );
}

export function CustomPageForm({ page }: { page?: Tables<"custom_pages"> }) {
  const router = useRouter();
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [heading, setHeading] = useState(page?.heading ?? "");
  const [subheading, setSubheading] = useState(page?.subheading ?? "");
  const [introduction, setIntroduction] = useState(page?.introduction ?? page?.description ?? "");
  const [mainContent, setMainContent] = useState(page?.main_content ?? "");
  const [metaTitle, setMetaTitle] = useState(page?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(page?.meta_description ?? "");
  const [filterId, setFilterId] = useState(page?.filter_id && page.filter_id !== "" ? page.filter_id : "all");
  const [isPublished, setIsPublished] = useState(page?.is_published ?? false);
  const [noindex, setNoindex] = useState(page?.noindex ?? false);
  const [canonicalUrl, setCanonicalUrl] = useState(page?.canonical_url ?? "");
  const [ogImage, setOgImage] = useState(page?.og_image ?? "");
  const [showInFooter, setShowInFooter] = useState(page?.show_in_footer ?? false);
  const [footerLabel, setFooterLabel] = useState(page?.footer_label ?? "");
  const [faq, setFaq] = useState<FaqItem[]>(page?.faq ?? []);
  const [links, setLinks] = useState<RelatedLink[]>(page?.related_links ?? []);
  const [submitting, setSubmitting] = useState(false);

  const issues = indexabilityIssues({
    slug,
    is_published: true,
    noindex,
    canonical_url: canonicalUrl || null,
    introduction,
    main_content: mainContent,
    description: null,
    meta_title: metaTitle,
    meta_description: metaDescription,
    heading,
  });
  const contentLength = customPageContentLength({ introduction, main_content: mainContent, description: null });
  const overrides = getMarketPage(slug);

  async function handleSave() {
    setSubmitting(true);
    try {
      const input = {
        title,
        slug,
        heading,
        subheading,
        introduction,
        main_content: mainContent,
        meta_title: metaTitle,
        meta_description: metaDescription,
        filter_id: filterId,
        is_published: isPublished,
        noindex,
        canonical_url: canonicalUrl,
        og_image: ogImage,
        show_in_footer: showInFooter,
        footer_label: footerLabel,
        faq: faq.filter((f) => f.question.trim() || f.answer.trim()),
        related_links: links.filter((l) => l.label.trim() || l.href.trim()),
      };
      if (page) await updateCustomPage(page.id, input);
      else await createCustomPage(input);
      toast.success("Saved");
      router.push("/admin/pages");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cp-title">Internal title</Label>
          <Input
            id="cp-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!page && !slug) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-slug">URL: /tips/…</Label>
          <Input id="cp-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        </div>
      </div>

      {overrides && (
        <p className="rounded-lg border border-brand/40 bg-brand/5 p-3 text-sm">
          This slug is the built-in <strong>{overrides.h1}</strong> page. Saving it as published overrides that page&apos;s SEO title,
          meta description, H1, introduction and FAQ; anything left empty keeps the built-in copy (e.g. title “{overrides.title}”).
          Main content is added below the built-in sections. Predictions and statistics are unchanged.
        </p>
      )}

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Search appearance</legend>
        <div className="space-y-2">
          <Label htmlFor="cp-meta-title" className="flex justify-between">
            SEO title (brand is appended) <Counter value={metaTitle} max={60} />
          </Label>
          <Input id="cp-meta-title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-meta-desc" className="flex justify-between">
            Meta description <Counter value={metaDescription} max={158} />
          </Label>
          <Textarea id="cp-meta-desc" rows={2} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cp-canonical">Canonical override (optional)</Label>
            <Input id="cp-canonical" placeholder="/tips/btts" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-og">Social image URL (optional)</Label>
            <Input id="cp-og" placeholder="https://…" value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Only set a canonical override when this page duplicates another URL — it removes this page from the sitemap.
        </p>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Page content</legend>
        <div className="space-y-2">
          <Label htmlFor="cp-h1">H1 heading</Label>
          <Input id="cp-h1" value={heading} onChange={(e) => setHeading(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-sub">Subheading</Label>
          <Input id="cp-sub" value={subheading} onChange={(e) => setSubheading(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-intro" className="flex justify-between">
            Introduction (answer the search query directly) <Counter value={introduction} max={1200} />
          </Label>
          <Textarea id="cp-intro" rows={3} value={introduction} onChange={(e) => setIntroduction(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-body">Main content</Label>
          <Textarea id="cp-body" rows={10} value={mainContent} onChange={(e) => setMainContent(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Plain text. Blank line = new paragraph, “## ” = sub-heading (“### ” smaller), “- ” = bullet, “1. ” = numbered item,
            **bold**, [link text](/tips/btts). {contentLength}/{MIN_INDEXABLE_CONTENT_LENGTH}+ characters of original content needed
            to be indexable.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Predictions shown</Label>
          <Select value={filterId} onValueChange={(v) => setFilterId(v ?? "all")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All predictions for the day</SelectItem>
              {MARKET_PAGES.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.tabLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">FAQ (shown on the page and as FAQ structured data)</legend>
        {faq.map((item, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-muted/40 p-3">
            <Input placeholder="Question" value={item.question} onChange={(e) => setFaq(faq.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)))} />
            <Textarea placeholder="Answer" rows={2} value={item.answer} onChange={(e) => setFaq(faq.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)))} />
            <Button variant="ghost" size="sm" onClick={() => setFaq(faq.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        ))}
        {faq.length < 10 && (
          <Button variant="outline" size="sm" onClick={() => setFaq([...faq, { question: "", answer: "" }])}>
            <Plus className="size-4" /> Add question
          </Button>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Related links (internal only)</legend>
        {links.map((link, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Anchor text" value={link.label} onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))} />
            <Input placeholder="/tips/btts" value={link.href} onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, href: e.target.value } : l)))} />
            <Button variant="ghost" size="icon-sm" aria-label="Remove link" onClick={() => setLinks(links.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {links.length < 10 && (
          <Button variant="outline" size="sm" onClick={() => setLinks([...links, { label: "", href: "" }])}>
            <Plus className="size-4" /> Add link
          </Button>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Publishing</legend>
        <div className="flex items-center justify-between">
          <Label htmlFor="cp-published">Published</Label>
          <Switch id="cp-published" checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="cp-noindex">Noindex (keep out of search results)</Label>
          <Switch id="cp-noindex" checked={noindex} onCheckedChange={setNoindex} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="cp-footer">Show in footer</Label>
          <Switch id="cp-footer" checked={showInFooter} onCheckedChange={setShowInFooter} />
        </div>
        {showInFooter && <Input placeholder="Footer label" value={footerLabel} onChange={(e) => setFooterLabel(e.target.value)} />}
        {overrides ? (
          <div className="rounded-lg bg-muted p-3 text-xs">Built-in pages are always listed in the sitemap{noindex ? " — but “noindex” will hide this one from search" : ""}.</div>
        ) : (
          <div className={`rounded-lg p-3 text-xs ${issues.length === 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800 dark:text-amber-300"}`}>
            {issues.length === 0 ? "Ready to be indexed and listed in the sitemap." : `Won't be indexed: ${issues.join("; ")}.`}
          </div>
        )}
      </fieldset>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving…" : "Save page"}
        </Button>
        <Button variant="outline" render={<Link href="/admin/pages" />}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
