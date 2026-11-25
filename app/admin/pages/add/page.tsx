import Link from "next/link";
import type { Metadata } from "next";
import { CustomPageForm } from "@/components/admin/custom-page-form";

export const metadata: Metadata = { title: "Add SEO page" };

export default function AddCustomPagePage() {
  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
        ← SEO pages
      </Link>
      <h1 className="mt-2 text-xl font-bold">Add page</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Published at /tips/[slug]. Check the keyword map in lib/seo/market-pages.ts first: two pages targeting the same query
        compete with each other.
      </p>
      <div className="mt-6">
        <CustomPageForm />
      </div>
    </div>
  );
}
