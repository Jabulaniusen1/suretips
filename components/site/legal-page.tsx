export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="prose prose-neutral mt-6 max-w-none">{children}</div>
    </div>
  );
}
