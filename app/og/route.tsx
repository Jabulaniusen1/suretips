import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Branded social sharing card: /og (default) or /og?title=Page%20title.
// Used as the Open Graph / Twitter image for every page without its own.

let logoData: Promise<string> | undefined;
function loadLogo() {
  logoData ??= readFile(join(process.cwd(), "public/logo-on-dark.png")).then((buf) => `data:image/png;base64,${buf.toString("base64")}`);
  return logoData;
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("title") ?? "";
  const title = raw.replace(/\s+/g, " ").trim().slice(0, 120) || "Free Football Predictions & Match Analysis";
  const logo = await loadLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0b1220",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img src={logo} width={218} height={110} alt="" />
        </div>
        <div style={{ display: "flex", fontSize: title.length > 60 ? 60 : 72, fontWeight: 800, lineHeight: 1.1, maxWidth: 1040 }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#94a3b8" }}>
          <span>Free predictions · Match data · Transparent results</span>
          <span>18+ · Bet responsibly</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
    }
  );
}
