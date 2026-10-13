"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Runs `onReset` when the form containing `ref` resets.
 *
 * React resets a form after every action submission, including one that came
 * back with validation errors. That clears uncontrolled inputs — so any
 * component mirroring an input's value in state has to clear that state too,
 * or the two drift apart and the UI describes a value the field no longer
 * holds (an empty password box under a full strength meter, for instance).
 */
export function useFormReset(ref: RefObject<HTMLElement | null>, onReset: () => void) {
  // Held in a ref so a caller passing an inline closure doesn't resubscribe on
  // every render. Assigned in an effect rather than during render, so the ref
  // is never written while React is rendering.
  const handler = useRef(onReset);
  useEffect(() => {
    handler.current = onReset;
  });

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;

    const listener = () => handler.current();
    form.addEventListener("reset", listener);
    return () => form.removeEventListener("reset", listener);
  }, [ref]);
}
