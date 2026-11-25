import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("published", false)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });

  let published = 0;
  for (const post of due ?? []) {
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ published: true, published_at: now })
      .eq("id", post.id);
    if (!updateError) published += 1;
  }

  // New posts appear on /blog, the homepage, the sitemap and their own URL.
  if (published > 0) revalidatePath("/", "layout");

  return NextResponse.json({ published });
}
