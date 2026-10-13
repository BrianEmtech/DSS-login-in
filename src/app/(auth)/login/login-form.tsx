"use client";

import { login, type AuthState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Checkbox, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useErrorFocus } from "@/hooks/use-error-focus";
import { useLiveErrors } from "@/hooks/use-live-errors";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useRef } from "react";

const initialState: AuthState = { ok: false };

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction] = useActionState(login, initialState);
  const { errors, clearError } = useLiveErrors(state.errors);
  const formRef = useRef<HTMLFormElement>(null);

  useErrorFocus(formRef, state);

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      description="Enter your work credentials to reach your DSS workspace."
    >
      {notice && (
        <div className="mb-5">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}

      <form action={formAction} ref={formRef} noValidate className="space-y-5">
        {/* FormAlert carries its own role and aria-live; wrapping it in another
            live region makes screen readers announce the message twice. */}
        {state.message && <FormAlert tone="error">{state.message}</FormAlert>}

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

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password}
          onInput={() => clearError("password")}
          labelAction={
            <Link
              href="/forgot-password"
              className="rounded text-sm font-medium text-brand-700 transition-colors duration-200 hover:text-brand-900"
            >
              Forgot password?
            </Link>
          }
        />

        <Checkbox id="remember" name="remember" defaultChecked>
          Keep me signed in on this device
        </Checkbox>

        <div className="pt-1">
          <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-ink-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="rounded font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
        >
          Request access
        </Link>
      </p>
    </AuthShell>
  );
}
