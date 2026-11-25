import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomPageForm } from "@/components/admin/custom-page-form";

export const metadata: Metadata = { title: "Edit SEO page" };

export default async function EditCustomPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: page } = await supabase.from("custom_pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();

  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
        ← SEO pages
      </Link>
      <h1 className="mt-2 text-xl font-bold">Edit page</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {page.is_published ? (
          <Link href={`/tips/${page.slug}`} target="_blank" className="text-brand hover:underline">
            /tips/{page.slug}
          </Link>
        ) : (
          <>/tips/{page.slug} · Draft</>
        )}
      </p>
      <div className="mt-6">
        <CustomPageForm page={page} />
      </div>
    </div>
  );
}
