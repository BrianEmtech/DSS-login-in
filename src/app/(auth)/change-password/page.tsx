import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

import { readResetToken } from "@/lib/session";

import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Set a new password",
  description: "Choose a new password for your DSS account.",
};

export default async function ChangePasswordPage() {
  // The token lives in an httpOnly cookie set at the end of the OTP step, so
  // the page itself never sees it in a URL and neither does anything reading
  // history, access logs or `Referer`.
  const token = await readResetToken();

  if (!token) {
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
        <div className="w-full max-w-md space-y-6 text-center">
          <LogoMark className="mx-auto h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            This link isn&apos;t valid
          </h1>
          <FormAlert tone="error">
            Password reset links expire after 15 minutes and can only be used once. Request a new
            code to continue.
          </FormAlert>
          <Link
            href="/forgot-password"
            className={buttonClass({ variant: "primary", size: "lg", fullWidth: true })}
          >
            Request a new code
          </Link>
        </div>
      </main>
    );
  }

  return <ChangePasswordForm />;
}
