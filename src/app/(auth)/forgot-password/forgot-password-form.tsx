"use client";

import { forgotPassword, type AuthState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { useErrorFocus } from "@/hooks/use-error-focus";
import { useLiveErrors } from "@/hooks/use-live-errors";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

const initialState: AuthState = { ok: false };

export function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(forgotPassword, initialState);
  const { errors, clearError } = useLiveErrors(state.errors);
  const formRef = useRef<HTMLFormElement>(null);

  useErrorFocus(formRef, state);

  useEffect(() => {
    if (state.ok && state.next) {
      const next = state.next;
      const timer = setTimeout(() => router.push(next), 1400);
      return () => clearTimeout(timer);
    }
  }, [state.ok, state.next, router]);

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter the email linked to your account and we'll send you a 6-digit code to verify it's you."
    >
      <form action={formAction} ref={formRef} noValidate className="space-y-5">
        {state.message && (
          <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>
        )}

        <TextField
          id="email"
          name="email"
          label="Work email"
          type="email"
          icon={Mail}
          placeholder="name@organisation.org"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          error={errors.email}
          defaultValue={state.values?.email}
          onChange={() => clearError("email")}
        />

        <div className="pt-1">
          <SubmitButton pendingLabel="Sending code…">Send reset code</SubmitButton>
        </div>

        {state.ok && state.next && (
          <p className="text-center text-sm text-ink-600">
            Taking you to the next step…{" "}
            <Link href={state.next} className="font-semibold text-brand-700 underline">
              Continue now
            </Link>
          </p>
        )}
      </form>

      <div className="mt-8 border-t border-ink-200 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
