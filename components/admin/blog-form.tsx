"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BlogEditor } from "@/components/admin/blog-editor";
import { createBlogPost, updateBlogPost } from "@/lib/actions/client";
import { type BlogPostInput } from "@/lib/actions/admin/blog";
import type { Tables } from "@/types/database";

export const BLOG_CATEGORIES = ["Betting market guides", "Match analysis", "League analysis", "Football statistics", "Betting explained", "News"];

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function Counter({ value, max }: { value: string; max: number }) {
  return <span className={value.length > max ? "text-destructive" : "text-muted-foreground"}>{value.length}/{max}</span>;
}

export function BlogForm({ post, competitions }: { post?: Tables<"blog_posts">; competitions: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(post?.featured_image_alt ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "");
  const [competitionId, setCompetitionId] = useState(post?.competition_id ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [mode, setMode] = useState<BlogPostInput["publishMode"]>(post?.published ? "publish" : post?.scheduled_at ? "schedule" : "draft");
  const [scheduledAt, setScheduledAt] = useState(post?.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const input: BlogPostInput = {
        title,
        slug,
        content,
        excerpt,
        featured_image: featuredImage,
        featured_image_alt: featuredImageAlt,
        category,
        author_name: authorName,
        competition_id: competitionId || null,
        meta_title: metaTitle,
        meta_description: metaDescription,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        publishMode: mode,
        scheduled_at: mode === "schedule" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      };
      if (post) await updateBlogPost(post.id, input);
      else await createBlogPost(input);
      toast.success(mode === "publish" ? "Published" : mode === "schedule" ? "Scheduled" : "Draft saved");
      router.push("/admin/blog");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="b-title">Title (H1)</Label>
        <Input
          id="b-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-slug">Slug (/blog/…)</Label>
          <Input
            id="b-slug"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-category">Category</Label>
          <Input id="b-category" list="blog-categories" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="blog-categories">
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-author">Author byline</Label>
          <Input id="b-author" placeholder="Blank = SureMatchContact editorial team" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          <p className="text-xs text-muted-foreground">Use the real name of the person who wrote and checked the article.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-comp">Related competition</Label>
          <select id="b-comp" value={competitionId} onChange={(e) => setCompetitionId(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option value="">None</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-excerpt" className="flex justify-between">
          Excerpt <Counter value={excerpt} max={300} />
        </Label>
        <Textarea id="b-excerpt" rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-image">Featured image URL</Label>
          <Input id="b-image" placeholder="https://…" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-alt">Image alt text</Label>
          <Input id="b-alt" placeholder="Describe what the image shows" value={featuredImageAlt} onChange={(e) => setFeaturedImageAlt(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <BlogEditor content={content} onChange={setContent} />
        <p className="text-xs text-muted-foreground">
          Use H2/H3 sub-headings, answer the reader&apos;s question early, and link to relevant market or competition pages. Check every
          statistic before publishing.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="b-meta-title" className="flex justify-between">
            SEO title <Counter value={metaTitle} max={60} />
          </Label>
          <Input id="b-meta-title" placeholder="Defaults to the title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-tags">Tags (comma-separated)</Label>
          <Input id="b-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="b-meta-desc" className="flex justify-between">
          Meta description <Counter value={metaDescription} max={158} />
        </Label>
        <Textarea id="b-meta-desc" rows={2} placeholder="Defaults to the excerpt" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Publishing</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {(
            [
              ["draft", "Draft"],
              ["publish", post?.published ? "Published" : "Publish now"],
              ["schedule", "Schedule"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="publish-mode" checked={mode === value} onChange={() => setMode(value)} />
              {label}
            </label>
          ))}
        </div>
        {mode === "schedule" && (
          <div className="space-y-2">
            <Label htmlFor="b-schedule">Publish at (your local time)</Label>
            <Input id="b-schedule" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            <p className="text-xs text-muted-foreground">Scheduled posts are published by a job that runs every 10 minutes.</p>
          </div>
        )}
      </fieldset>

      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : mode === "publish" ? (post?.published ? "Update post" : "Publish post") : mode === "schedule" ? "Schedule post" : "Save draft"}
      </Button>
    </div>
  );
}
