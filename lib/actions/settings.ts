"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Only these columns are user-editable; anything else in the payload (email,
// is_admin, ...) is dropped rather than written.
const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Enter your name").max(100),
  country: z.string().trim().min(1).max(80),
  // "" clears the avatar; otherwise it must be a file in this project's avatars bucket.
  avatar_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || null)
    .refine((v) => v === null || v.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`), "Invalid image URL"),
});

async function updateProfileImpl(input: { full_name: string; country: string; avatar_url?: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid profile");

  const { error } = await supabase.from("users").update(parsed.data).eq("id", data.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function updateProfile(...args: Parameters<typeof updateProfileImpl>) {
  return toActionResult(() => updateProfileImpl(...args));
}
