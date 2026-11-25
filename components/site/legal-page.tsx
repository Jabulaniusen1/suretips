import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { formatDateKeyLong } from "@/lib/utils/date";

/** Long-form information page with breadcrumbs and a visible "last updated" date. */
export function LegalPage({
  title,
  path,
  updated,
  intro,
  children,
}: {
  title: string;
  path: string;
  /** yyyy-MM-dd of the last substantive change -- keep in sync with app/sitemap.ts. */
  updated: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: title, path }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated <time dateTime={updated}>{formatDateKeyLong(updated)}</time>
      </p>
      {intro && <div className="mt-4 text-lg text-muted-foreground">{intro}</div>}
      <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">{children}</div>
    </div>
  );
}
