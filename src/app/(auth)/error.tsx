"use client";

import { useEffect } from "react";
import Link from "next/link";

import { LogoMark } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

/**
 * Catches anything an auth screen throws that isn't a handled form error.
 *
 * Without this the default overlay takes over, which on a sign-in page reads as
 * "the product is broken" and offers no way back.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to your error reporter. `digest` is the id that correlates
    // this with the server-side stack trace.
    console.error("[auth] unhandled error", error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <LogoMark className="mx-auto h-12 w-12" />
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Something went wrong
        </h1>

        <FormAlert tone="error">
          We couldn&apos;t finish that request. Your account hasn&apos;t been changed. Try
          again, and if it keeps happening contact your administrator
          {error.digest ? ` quoting reference ${error.digest}` : ""}.
        </FormAlert>

        <div className="space-y-3">
          <button
            type="button"
            onClick={reset}
            className={buttonClass({ variant: "primary", size: "lg", fullWidth: true })}
          >
            Try again
          </button>
          <Link
            href="/login"
            className={buttonClass({ variant: "secondary", size: "lg", fullWidth: true })}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
