"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// import Link from "next/link"; // only used by the disabled "Create one" sign-up link
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

// User accounts are turned off: only admins sign in, so the admin panel is the
// default destination (was "/dashboard").
const DEFAULT_REDIRECT = "/admin";

/** Only same-site paths -- never an absolute or protocol-relative URL (open redirect). */
function safeRedirect(target: string | null): string {
  // Resolve like the browser would: "/\tevil.com" or "/%09/evil.com" pass a
  // prefix check but resolve to another origin.
  if (!target) return DEFAULT_REDIRECT;
  try {
    const url = new URL(target, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_REDIRECT;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    // Only admins have a signed-in area now; don't leave other accounts signed in.
    const { data: profile } = await supabase.from("users").select("is_admin").eq("id", data.user.id).maybeSingle();
    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setSubmitting(false);
      toast.error("This account doesn't have admin access.");
      return;
    }

    setSubmitting(false);
    toast.success("Welcome back!");
    router.push(safeRedirect(searchParams.get("redirect")));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Logging in…" : "Log In"}
      </Button>
      {/* User accounts are turned off (sign-up disabled in app/_signup).
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
      */}
    </form>
  );
}
