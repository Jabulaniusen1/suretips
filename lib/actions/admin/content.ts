"use server";

import { toActionResult } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";
import { CONTENT_ROW_KEY, getContentGroups, type StoredContent } from "@/lib/content/registry";
import { lagosDateKey } from "@/lib/utils/date";

const MAX_LENGTH = { line: 500, text: 30000 } as const;

/**
 * Saves one Admin > Site Content group. Only edits are stored: a value equal to
 * the default (or an emptied required field) removes the edit, so later
 * changes to the default copy still reach the site.
 */
async function saveSiteContentImpl(groupId: string, values: Record<string, string>) {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");

  const group = getContentGroups().find((g) => g.id === groupId);
  if (!group) throw new Error("Unknown section");

  const supabase = await createClient();
  const { data, error } = await supabase.from("site_config").select("value").eq("key", CONTENT_ROW_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  const stored = (data?.value ?? {}) as StoredContent;
  const texts = { ...(stored.texts ?? {}) };
  const pageUpdated = { ...(stored.pageUpdated ?? {}) };

  let changed = 0;
  for (const field of group.fields) {
    const raw = values[field.key];
    if (raw === undefined) continue;
    if (typeof raw !== "string") throw new Error(`${field.label}: invalid value`);

    let value = raw.replace(/\r\n?/g, "\n").trim();
    if (field.kind === "line") value = value.replace(/\s*\n\s*/g, " ");
    if (value.length > MAX_LENGTH[field.kind]) throw new Error(`${field.label} is too long (max ${MAX_LENGTH[field.kind]} characters).`);

    const before = texts[field.key];
    if (value === field.default.trim() || (value === "" && !field.optional)) delete texts[field.key];
    else texts[field.key] = value;
    if (texts[field.key] !== before) changed += 1;
  }

  if (changed === 0) return { changed };
  if (group.section === "Long pages") pageUpdated[group.id.replace(/^page-/, "")] = lagosDateKey();

  const value: StoredContent = { texts, pageUpdated };
  const { error: saveError } = await supabase
    .from("site_config")
    .upsert({ key: CONTENT_ROW_KEY, value: value as unknown as Record<string, unknown>, updated_at: new Date().toISOString() });
  if (saveError) throw new Error(saveError.message);

  revalidatePath("/", "layout");
  return { changed };
}

// Exported actions return { ok, data | error } -- see lib/actions/result.ts.
export async function saveSiteContent(...args: Parameters<typeof saveSiteContentImpl>) {
  return toActionResult(() => saveSiteContentImpl(...args));
}
