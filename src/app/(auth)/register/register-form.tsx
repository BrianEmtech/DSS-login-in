"use client";

import { register, type AuthState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { Checkbox, SelectField, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useErrorFocus } from "@/hooks/use-error-focus";
import { useLiveErrors } from "@/hooks/use-live-errors";
import { Briefcase, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

const initialState: AuthState = { ok: false };

const ROLES = [
  { value: "", label: "Select your role" },
  { value: "Analyst", label: "Analyst" },
  { value: "Decision Maker", label: "Decision Maker" },
  { value: "Administrator", label: "Administrator" },
  { value: "Auditor", label: "Auditor" },
];

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(register, initialState);
  const { errors, clearError } = useLiveErrors(state.errors);
  const formRef = useRef<HTMLFormElement>(null);

  useErrorFocus(formRef, state);

  // The action hands back the OTP step rather than redirecting itself, so the
  // success banner is readable before we move on.
  useEffect(() => {
    if (state.ok && state.next) {
      const next = state.next;
      const timer = setTimeout(() => router.push(next), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.ok, state.next, router]);

  return (
    <AuthShell
      eyebrow="Get access"
      title="Create your account"
      description="Set up your workspace in a couple of minutes. We'll verify your email before anything is created."
    >
      <form action={formAction} ref={formRef} noValidate className="space-y-5">
        {/* FormAlert carries its own role and aria-live; wrapping it in another
            live region makes screen readers announce the message twice. */}
        {state.message && (
          <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>
        )}

        <TextField
          id="fullName"
          name="fullName"
          label="Full name"
          icon={User}
          placeholder="Amina Okello"
          autoComplete="name"
          required
          error={errors.fullName}
          defaultValue={state.values?.fullName}
          onChange={() => clearError("fullName")}
        />

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

        <TextField
          id="organisation"
          name="organisation"
          label="Organisation"
          icon={Briefcase}
          placeholder="Ministry of Planning"
          autoComplete="organization"
          required
          error={errors.organisation}
          defaultValue={state.values?.organisation}
          onChange={() => clearError("organisation")}
        />

        <SelectField
          id="role"
          name="role"
          label="Role"
          options={ROLES}
          required
          error={errors.role}
          defaultValue={state.values?.role}
          onChange={() => clearError("role")}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          showMeter
          error={errors.password}
          onInput={() => clearError("password")}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
          onInput={() => clearError("confirmPassword")}
        />

        <Checkbox
          id="terms"
          name="terms"
          error={errors.terms}
          onChange={() => clearError("terms")}
        >          I agree to the{" "}
          <Link href="/terms" className="font-medium text-brand-700 underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </Checkbox>

        <div className="pt-1">
          <SubmitButton pendingLabel="Sending code…">Create account</SubmitButton>
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

      <p className="mt-8 text-center text-sm text-ink-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded font-semibold text-brand-700 transition-colors duration-200 hover:text-brand-900"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
