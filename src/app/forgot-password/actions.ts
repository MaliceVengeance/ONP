"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=Please+enter+your+email+address.");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://www.ournextproject.us/reset-password",
  });

  if (error) {
    const msg = encodeURIComponent(error.message);
    redirect(`/forgot-password?error=${msg}`);
  }

  redirect("/forgot-password?sent=1");
}