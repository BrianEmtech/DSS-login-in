"use client";

import { useEffect } from "react";
import Link from "next/link";

import { LogoMark } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

/**
 * Fallback boundary for anything outside the auth screens, which have their own.
 *
 * `verifySession` throws rather than redirecting when the account service can't
 * be reached, so this is what a signed-in user sees during a backend outage —
 * instead of being bounced to a sign-in page that would also fail.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to your error reporter.
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          We can&apos;t load this right now
        </h1>

        <FormAlert tone="error">
          The service didn&apos;t respond. You are still signed in — this is usually
          temporary, so try again in a moment
          {error.digest ? `, quoting reference ${error.digest}` : ""}.
        </FormAlert>

        <button
          type="button"
          onClick={reset}
          className={buttonClass({ variant: "primary", size: "lg", fullWidth: true })}
        >
          Try again
        </button>

        <p className="text-sm text-ink-600">
          Still stuck?{" "}
          <Link href="/login" className="font-semibold text-brand-700 underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
