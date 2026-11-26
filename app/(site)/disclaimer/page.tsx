import type { Metadata } from "next";
import { EditableLongPage, longPageMetadata } from "@/components/site/editable-long-page";

// Heading, intro, text and SEO fields are edited in Admin > Site Content.
export async function generateMetadata(): Promise<Metadata> {
  return longPageMetadata("disclaimer");
}

export default function DisclaimerPage() {
  return <EditableLongPage slug="disclaimer" />;
}
