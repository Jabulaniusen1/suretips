import { Logo } from "@/components/site/logo";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <Logo imgClassName="h-20 w-auto sm:h-24" />
        </div>
        <h1 className="mt-6 text-center text-xl font-bold">{title}</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
