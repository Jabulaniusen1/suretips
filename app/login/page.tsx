import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" description="Log in to access your predictions and VIP plans.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
