"use client";

import { changePassword, type AuthState } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useErrorFocus } from "@/hooks/use-error-focus";
import { useLiveErrors } from "@/hooks/use-live-errors";
import { useActionState, useRef } from "react";

const initialState: AuthState = { ok: false };

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, initialState);
  const { errors, clearError } = useLiveErrors(state.errors);
  const formRef = useRef<HTMLFormElement>(null);

  useErrorFocus(formRef, state);

  return (
    <AuthShell
      eyebrow="Choose a new password"
      title="Set a new password"
      description="Pick something you don't use elsewhere. You'll sign in with it from now on."
    >
      <form action={formAction} ref={formRef} noValidate className="space-y-5">
        {state.message && <FormAlert tone="error">{state.message}</FormAlert>}

        <PasswordField
          id="newPassword"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          required
          showMeter
          error={errors.newPassword}
          onInput={() => clearError("newPassword")}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
          onInput={() => clearError("confirmPassword")}
        />

        <div className="pt-1">
          <SubmitButton pendingLabel="Updating…" variant="primary">
            Update password
          </SubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}
