import type { Metadata } from "next";
import { EditableLongPage, longPageMetadata } from "@/components/site/editable-long-page";

// Heading, intro, text and SEO fields are edited in Admin > Site Content.
export async function generateMetadata(): Promise<Metadata> {
  return longPageMetadata("cookies");
}

export default function CookiesPage() {
  return <EditableLongPage slug="cookies" />;
}
