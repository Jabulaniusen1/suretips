"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BlogEditor } from "@/components/admin/blog-editor";
import { createBlogPost, updateBlogPost, type BlogPostInput } from "@/lib/actions/admin/blog";
import type { Tables } from "@/types/database";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function BlogForm({ post }: { post?: Tables<"blog_posts"> }) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!title || !slug || !content) return toast.error("Title, slug and content are required");
    setSubmitting(true);
    try {
      const input: BlogPostInput = {
        title,
        slug,
        content,
        excerpt,
        featured_image: featuredImage,
        published,
        meta_title: metaTitle,
        meta_description: metaDescription,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (post) await updateBlogPost(post.id, input, post.published);
      else await createBlogPost(input);
      toast.success("Saved");
      router.push("/admin/blog");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label>Excerpt</Label>
        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Featured Image URL</Label>
        <Input value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Content</Label>
        <BlogEditor content={content} onChange={setContent} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Meta Description</Label>
        <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Published</Label>
        <Switch checked={published} onCheckedChange={setPublished} />
      </div>
      <Button onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : post ? "Update Post" : "Publish Post"}
      </Button>
    </div>
  );
}
