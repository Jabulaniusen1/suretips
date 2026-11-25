import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin";

// Raster images only: SVG and HTML can carry script and would be served from
// a public bucket.
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
// Vercel rejects request bodies over 4.5 MB before this route runs.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, AVIF or GIF image." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Images must be 4 MB or smaller." }, { status: 413 });

  // Descriptive, URL-safe file names help image search; strip anything else.
  const base =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "image";
  const path = `${new Date().toISOString().slice(0, 10)}/${base}-${Date.now().toString(36)}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
