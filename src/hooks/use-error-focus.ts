"use client";

import { useEffect, useRef, type RefObject } from "react";

type FocusableState = {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
};

/**
 * Moves focus to the first problem after a failed submit.
 *
 * Without this, focus lands on `<body>`: the submit button disables itself
 * while the action is pending, and a disabled element can't hold focus. A
 * keyboard or screen reader user is dropped at the top of the document with no
 * indication of what went wrong or where it is.
 *
 * Prefers the first invalid field, and falls back to the page-level banner for
 * errors that don't belong to any one field.
 */
export function useErrorFocus(
  formRef: RefObject<HTMLFormElement | null>,
  state: FocusableState,
) {
  // Identity comparison: each action result is a fresh object, so this fires
  // once per submission rather than on every unrelated re-render.
  const seen = useRef<FocusableState | null>(null);

  useEffect(() => {
    if (seen.current === state) return;
    const isFirstRun = seen.current === null;
    seen.current = state;
    if (isFirstRun || state.ok) return;

    const form = formRef.current;
    if (!form) return;

    const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (state.message) {
      form.querySelector<HTMLElement>("[data-form-alert]")?.focus();
    }
  }, [state, formRef]);
}
