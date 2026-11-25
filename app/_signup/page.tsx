import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" description="Optional — every prediction is free without an account. An account lets you message our support team.">
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
