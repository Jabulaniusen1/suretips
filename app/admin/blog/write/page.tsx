import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = { title: "Write Post" };

export default async function AdminBlogWritePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  let post = undefined;

  if (id) {
    const supabase = await createClient();
    const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    post = data;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{post ? "Edit Post" : "Write New Post"}</h1>
      <div className="mt-4">
        <BlogForm post={post} />
      </div>
    </div>
  );
}
