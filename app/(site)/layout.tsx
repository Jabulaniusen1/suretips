import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

// Upper bound for how long any public page is served from cache before it
// is regenerated (pages can set a shorter value). Admin edits revalidate
// immediately via revalidatePath.
export const revalidate = 3600;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
