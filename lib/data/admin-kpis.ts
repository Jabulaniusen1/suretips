import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDaysToKey, lagosDateKey, lagosDayRange } from "@/lib/utils/date";

export async function getAdminKpis() {
  const supabase = await createClient();
  const today = lagosDayRange(lagosDateKey());
  const tomorrow = lagosDayRange(addDaysToKey(lagosDateKey(), 1));
  const now = new Date().toISOString();
  const count = { count: "exact" as const, head: true };

  const [todayCount, tomorrowCount, awaiting, needsGrading, posts, pages] = await Promise.all([
    supabase.from("predictions").select("id", count).gte("kickoff_time", today.from).lte("kickoff_time", today.to),
    supabase.from("predictions").select("id", count).gte("kickoff_time", tomorrow.from).lte("kickoff_time", tomorrow.to),
    supabase.from("predictions").select("id", count).eq("result_approved", false).neq("result", "pending"),
    // Finished (or long past kickoff) but still ungraded: needs a manual result.
    supabase
      .from("predictions")
      .select("id", count)
      .eq("result", "pending")
      .lte("kickoff_time", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()),
    supabase.from("blog_posts").select("id", count).eq("published", true).lte("published_at", now),
    supabase.from("custom_pages").select("id", count).eq("is_published", true),
    // User accounts are turned off, so new sign-ups are no longer counted.
    // supabase.from("users").select("id", count).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    predictionsToday: todayCount.count ?? 0,
    predictionsTomorrow: tomorrowCount.count ?? 0,
    awaitingVerification: awaiting.count ?? 0,
    needsGrading: needsGrading.count ?? 0,
    publishedPosts: posts.count ?? 0,
    publishedPages: pages.count ?? 0,
    // newUsers7d: signups.count ?? 0,
  };
}
