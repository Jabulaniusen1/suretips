import { redirect } from "next/navigation";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: highlightSlug } = await searchParams;
  redirect(highlightSlug ? `/pricing?plan=${encodeURIComponent(highlightSlug)}` : "/pricing");
}
