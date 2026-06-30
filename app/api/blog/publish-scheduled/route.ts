import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data: due } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("published", false)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now);

  let published = 0;
  for (const post of due ?? []) {
    const { error } = await supabase
      .from("blog_posts")
      .update({ published: true, published_at: now })
      .eq("id", post.id);
    if (!error) published += 1;
  }

  return NextResponse.json({ published });
}
