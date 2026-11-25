// next/image only optimises hosts listed in next.config.ts (Supabase Storage
// public objects and API-Sports media). Anything else must be rendered with
// `unoptimized`, otherwise the optimiser rejects it and the image breaks.

export function canOptimizeImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "media.api-sports.io") return true;
    return url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}
