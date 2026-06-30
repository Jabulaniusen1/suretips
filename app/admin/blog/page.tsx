import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { BlogList } from "@/components/admin/blog-list";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Blog</h1>
        <Button render={<Link href="/admin/blog/write" />}>+ Write Post</Button>
      </div>
      <div className="mt-4">
        <BlogList posts={posts ?? []} />
      </div>
    </div>
  );
}
