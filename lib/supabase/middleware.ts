import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// User accounts are turned off; the user dashboard is disabled (app/_dashboard).
// const PROTECTED_DASHBOARD_PREFIX = "/dashboard";
const PROTECTED_ADMIN_PREFIX = "/admin";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith(PROTECTED_ADMIN_PREFIX)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    // Signed in but not an admin: there is no user dashboard to send them to.
    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // User dashboard disabled (accounts are turned off).
  // if (pathname.startsWith(PROTECTED_DASHBOARD_PREFIX) && !user) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/login";
  //   url.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(url);
  // }

  return supabaseResponse;
}
