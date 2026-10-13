import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/dal";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your DSS workspace.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; registered?: string }>;
}) {
  // Someone who is already signed in has no use for this screen.
  if (await getSessionUser()) redirect("/dashboard");

  const { reset, registered } = await searchParams;

  const notice =
    reset === "1"
      ? "Your password has been reset. Sign in with your new password."
      : registered === "1"
        ? "Your account is ready. Sign in to get started."
        : undefined;

  return <LoginForm notice={notice} />;
}
