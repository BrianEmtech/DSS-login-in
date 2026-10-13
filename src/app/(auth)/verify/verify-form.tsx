"use client";

import { resendOtp, verifyOtp, type AuthState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { OtpInput } from "@/components/ui/otp-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useErrorFocus } from "@/hooks/use-error-focus";
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

const initialState: AuthState = { ok: false };

/** Shows just enough of the address to be recognisable. */
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const head = name.slice(0, Math.min(2, name.length));
  return `${head}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

const COPY = {
  register: {
    eyebrow: "Verify your email",
    title: "Check your inbox",
    description:
      "We sent a 6-digit verification code to your work email. Enter it below to finish creating your account.",
    submit: "Verify and continue",
    pending: "Verifying…",
  },
  "reset-password": {
    eyebrow: "Verify your identity",
    title: "Enter your reset code",
    description:
      "Enter the 6-digit code we sent to your work email. Once verified you'll be able to choose a new password.",
    submit: "Verify code",
    pending: "Verifying…",
  },
} as const;

export function VerifyForm({
  email,
  purpose,
}: {
  email: string;
  purpose: "register" | "reset-password";
}) {
  const copy = COPY[purpose];

  const [state, formAction] = useActionState(verifyOtp, initialState);
  const [resendState, resendAction] = useActionState(resendOtp, initialState);
  const [cooldown, setCooldown] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useErrorFocus(formRef, state);

  // Start the resend cooldown whenever a new code is issued. Keyed on the
  // result object, not on retryIn: two resends in a row both return 45, so a
  // value-based dependency never changes and the cooldown silently fails to
  // restart. Adjusted during render because React 19 rejects a synchronous
  // setState in an effect body.
  const [seenResend, setSeenResend] = useState(resendState);
  if (resendState !== seenResend) {
    setSeenResend(resendState);
    // Set from both the success and the "too soon" response, so the button
    // reflects the server's real cooldown rather than a client-side guess.
    if (resendState.retryIn) setCooldown(resendState.retryIn);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <AuthShell eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      <form action={formAction} ref={formRef} noValidate className="space-y-6">
        {state.message && <FormAlert tone="error">{state.message}</FormAlert>}

        <OtpInput
          label="6-digit verification code"
          hint="Paste the whole code if you'd rather not type it digit by digit."
          error={state.errors?.code}
          invalid={!state.ok && Boolean(state.message)}
        />

        <SubmitButton pendingLabel={copy.pending}>{copy.submit}</SubmitButton>
      </form>

      {/* Resend — separate form so it doesn't submit the code field */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-brand-600/20 bg-brand-50 px-3.5 py-3 text-sm text-brand-900">
          <MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Code sent to <span className="font-semibold">{maskEmail(email)}</span>
          </p>
        </div>

        {resendState.message && (
          <FormAlert tone={resendState.ok ? "info" : "error"}>{resendState.message}</FormAlert>
        )}

        <form action={resendAction}>
          <Button type="submit" variant="secondary" disabled={cooldown > 0} fullWidth>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>
        </form>

        <Link
          href={purpose === "register" ? "/register" : "/forgot-password"}
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {purpose === "register" ? "Back to registration" : "Use a different email"}
        </Link>
      </div>
    </AuthShell>
  );
}
