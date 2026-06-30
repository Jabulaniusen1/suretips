"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitFreeGamePrediction(predictionId: string, choice: "home" | "draw" | "away") {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("free_games_entries").upsert(
    { user_id: data.user.id, game_date: today, prediction: { prediction_id: predictionId, choice } },
    { onConflict: "user_id,game_date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/free-games");
}
