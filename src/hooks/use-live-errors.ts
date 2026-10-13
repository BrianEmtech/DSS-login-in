"use client";

import { useCallback, useMemo, useState } from "react";

import type { FieldErrors } from "@/lib/validation";

/**
 * Keeps server-returned field errors from lingering over a field the user is
 * actively fixing. An error is hidden as soon as that field is edited, and the
 * whole set is restored when a new submission comes back from the server.
 */
export function useLiveErrors(serverErrors: FieldErrors | undefined) {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const [seen, setSeen] = useState(serverErrors);

  // A fresh server result means a fresh attempt — show everything again.
  // Adjusted during render rather than in an effect: an effect would paint the
  // stale set first and then immediately re-render, and React 19 flags it.
  // Identity comparison is deliberate — each action result is a new object.
  if (serverErrors !== seen) {
    setSeen(serverErrors);
    setDismissed(new Set());
  }

  const errors = useMemo(() => {
    const active: FieldErrors = {};
    for (const [field, message] of Object.entries(serverErrors ?? {})) {
      if (!dismissed.has(field)) active[field] = message;
    }
    return active;
  }, [serverErrors, dismissed]);

  /** Attach to a field's `onChange` to clear its error. */
  const clearError = useCallback((field: string) => {
    setDismissed((prev) => (prev.has(field) ? prev : new Set([...prev, field])));
  }, []);

  return { errors, clearError };
}
