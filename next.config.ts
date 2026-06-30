import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Supabase Storage public URLs and API-Sports team/league logos.
    // Tighten this to your actual Supabase project domain before launch.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
};

export default nextConfig;
