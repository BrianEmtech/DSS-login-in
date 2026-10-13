import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";
import { FormAlert } from "@/components/ui/form-alert";
import { readPendingVerification } from "@/lib/session";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Enter verification code",
  description: "Enter the 6-digit code we sent to verify your identity.",
  robots: { index: false, follow: false },
};

export default async function VerifyPage() {
  // The address under verification comes from the cookie written when the code
  // was requested. It is not readable or settable from the URL, so this step
  // can only ever act on a challenge this browser actually started.
  const pending = await readPendingVerification();

  if (!pending) {
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
        <div className="w-full max-w-md space-y-6 text-center">
          <LogoMark className="mx-auto h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Start from the previous step
          </h1>
          <FormAlert tone="error">
            We don&apos;t have an active verification request for this session. Request a new
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

  return <VerifyForm email={pending.email} purpose={pending.purpose} />;
}
