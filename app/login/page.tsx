import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Admin log in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <AuthShell title="Admin log in" description="Sign in to manage Sure Match Tips.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
