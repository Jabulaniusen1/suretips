import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" description="Sign up to track your predictions and packages in one place.">
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
