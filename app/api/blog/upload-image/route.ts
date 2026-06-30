import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const supabase = await createClient();
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
