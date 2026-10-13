"use client";

import { useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useFormReset } from "@/hooks/use-form-reset";

const LENGTH = 6;

/**
 * Six-box OTP input.
 *
 * Behaviour: auto-advance on entry, Backspace clears then steps back, arrow keys
 * move between boxes, and a pasted code is distributed across all of them. The
 * joined value is submitted through a hidden input named `code`.
 */
export function OtpInput({
  name = "code",
  label = "Verification code",
  hint,
  error,
  defaultValue = "",
  invalid,
  onInput,
}: {
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  defaultValue?: string;
  invalid?: boolean;
  /** Fires whenever any box changes — used to clear the code error. */
  onInput?: () => void;
}) {
  const start = defaultValue.replace(/\D/g, "").slice(0, LENGTH).split("");
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: LENGTH }, (_, i) => start[i] ?? ""),
  );
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const wrapper = useRef<HTMLDivElement>(null);
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  const describedBy = [errorId, error ? undefined : hintId].filter(Boolean).join(" ") || undefined;
  const code = digits.join("");

  function focusBox(index: number) {
    inputs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();
  }

  // These boxes are controlled, so the form reset that follows a submit leaves
  // them holding the code that was just rejected. Clear them and go back to the
  // first box, rather than making the user backspace six times.
  useFormReset(wrapper, () => {
    setDigits(Array.from({ length: LENGTH }, () => ""));
    focusBox(0);
  });

  function write(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    onInput?.();
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      write(index, "");
      return;
    }

    // More than one digit means the whole code was pasted into this box.
    if (cleaned.length > 1) {
      const next = [...digits];
      let cursor = index;
      for (const char of cleaned) {
        if (cursor >= LENGTH) break;
        next[cursor] = char;
        cursor += 1;
      }
      setDigits(next);
      focusBox(Math.min(cursor, LENGTH - 1));
      return;
    }

    write(index, cleaned);
    if (index < LENGTH - 1) focusBox(index + 1);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        write(index, "");
      } else if (index > 0) {
        write(index - 1, "");
        focusBox(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
      return;
    }
    if (event.key === "Enter" && code.length === LENGTH) {
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;

    // Fill from the box that was pasted into, keeping earlier digits intact.
    const firstEmpty = digits.findIndex((d) => d === "");
    const startIndex = firstEmpty === -1 ? 0 : firstEmpty;

    const next = [...digits];
    let cursor = startIndex;
    for (const char of pasted) {
      if (cursor >= LENGTH) break;
      next[cursor] = char;
      cursor += 1;
    }
    setDigits(next);
    focusBox(Math.min(cursor, LENGTH - 1));
  }

  const hasError = Boolean(error) || Boolean(invalid);

  return (
    <div className="space-y-2" ref={wrapper}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-800">{label}</legend>

        <input type="hidden" name={name} value={code} />

        <div className="flex gap-2 sm:gap-2.5" role="group" aria-label={label}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              value={digit}
              onChange={(e) => handleChange(index, e.currentTarget.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.currentTarget.select()}
              aria-label={`Digit ${index + 1} of ${LENGTH}`}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className={[
                "h-14 w-full min-w-0 rounded-lg border bg-white text-center font-display text-2xl font-semibold text-ink-900",
                "transition-[border-color,box-shadow] duration-200 ease-out focus-visible:outline-none",
                hasError
                  ? "border-danger-500 focus-visible:border-danger-600 focus-visible:ring-2 focus-visible:ring-danger-500/30"
                  : "border-ink-300 hover:border-ink-400 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25",
              ].join(" ")}
            />
          ))}
        </div>
      </fieldset>

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-xs font-medium text-danger-700"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
