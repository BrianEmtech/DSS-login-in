"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "@/components/ui/button";

/**
 * Submit button bound to the enclosing form's pending state, so it disables and
 * shows a spinner for the whole duration of the server action.
 */
export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  variant = "primary",
  fullWidth = true,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={buttonClass({ variant, size: "lg", fullWidth })}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
