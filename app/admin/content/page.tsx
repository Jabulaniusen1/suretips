import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CONTENT_ROW_KEY, getContentGroups, type GroupSection, type StoredContent } from "@/lib/content/registry";
import { SiteContentForm } from "@/components/admin/site-content-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Site Content" };

const SECTIONS: GroupSection[] = ["Site-wide", "Pages", "Long pages", "Markets"];

export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group: groupId } = await searchParams;
  const groups = getContentGroups();
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  // Read with the admin's session (not the cached public read) so edits show at once.
  const supabase = await createClient();
  const { data } = await supabase.from("site_config").select("value").eq("key", CONTENT_ROW_KEY).maybeSingle();
  const texts = ((data?.value ?? {}) as StoredContent).texts ?? {};
  const editedIn = (fields: { key: string }[]) => fields.filter((f) => f.key in texts).length;

  const nav = (
    <nav aria-label="Site content sections" className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section}>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section}</p>
          <ul className="mt-1.5 space-y-0.5">
            {groups
              .filter((g) => g.section === section)
              .map((g) => {
                const edited = editedIn(g.fields);
                return (
                  <li key={g.id}>
                    <Link
                      href={`/admin/content?group=${g.id}`}
                      aria-current={g.id === group.id ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm",
                        g.id === group.id ? "bg-brand/10 font-semibold text-brand" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="truncate">{g.title}</span>
                      {edited > 0 && <span className="shrink-0 rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">{edited}</span>}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div>
      <h1 className="text-xl font-bold">Site Content</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        Every heading, paragraph, button and label on the public site. Pick a section, change the text and save — it goes live straight
        away. Telegram, WhatsApp, email and social links are set in{" "}
        <Link href="/admin/config" className="font-medium text-brand hover:underline">
          Links &amp; Contact
        </Link>
        .
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside>
          {/* Phones: the section list folds away above the form. */}
          <details className="rounded-xl border border-border bg-card p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">
              Section: <span className="text-brand">{group.title}</span>
            </summary>
            <div className="mt-3">{nav}</div>
          </details>
          <div className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-border bg-card p-3 lg:block">{nav}</div>
        </aside>

        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.section}</p>
              <h2 className="text-lg font-bold">{group.title}</h2>
              {group.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{group.description}</p>}
            </div>
            {group.previewPath && (
              <Link
                href={group.previewPath}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand"
              >
                View page <ExternalLink aria-hidden className="size-3.5" />
              </Link>
            )}
          </div>
          <div className="mt-5">
            <SiteContentForm
              key={group.id}
              groupId={group.id}
              fields={group.fields.map((f) => ({
                key: f.key,
                label: f.label,
                kind: f.kind,
                help: f.help ?? null,
                vars: f.vars ? [...f.vars] : [],
                optional: Boolean(f.optional),
                defaultValue: f.default,
                value: f.key in texts ? texts[f.key] : f.default,
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
