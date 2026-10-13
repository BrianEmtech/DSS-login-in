"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useId, useRef, useState } from "react";

import { TextField } from "@/components/ui/field";
import { useFormReset } from "@/hooks/use-form-reset";
import { PASSWORD_MIN, SCORE_LABELS, passwordProblem, passwordScore } from "@/lib/validation";

const SEGMENT_COLORS = [
  "bg-danger-500",
  "bg-danger-500",
  "bg-accent-500",
  "bg-brand-500",
  "bg-success-600",
];

const RULES = [
  `At least ${PASSWORD_MIN} characters`,
  "One letter",
  "One number",
];

/**
 * Password input with a visibility toggle, a caps-lock hint, and an optional
 * 4-segment strength meter. Strength is always reported in text as well as
 * colour, so it isn't communicated by colour alone.
 */
export function PasswordField({
  id,
  name,
  label,
  labelAction,
  autoComplete = "current-password",
  error,
  defaultValue,
  showMeter = false,
  required = true,
  onInput,
}: {
  id: string;
  name: string;
  label: string;
  labelAction?: React.ReactNode;
  autoComplete?: string;
  error?: string;
  defaultValue?: string;
  showMeter?: boolean;
  required?: boolean;
  /** Fires on every keystroke — used to clear this field's error. */
  onInput?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const [capsLock, setCapsLock] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  const meterId = useId();
  const score = passwordScore(value);
  const remaining = PASSWORD_MIN - value.length;

  // React clears the input when the form resets after a submit. Mirror that
  // here, or the meter keeps describing a password that is no longer typed in.
  useFormReset(wrapper, () => {
    setValue(defaultValue ?? "");
    setCapsLock(false);
    setVisible(false);
  });

  return (
    <div className="space-y-2" ref={wrapper}>
      <TextField
        id={id}
        name={name}
        label={label}
        labelAction={labelAction}
        type={visible ? "text" : "password"}
        icon={Lock}
        autoComplete={autoComplete}
        error={error}
        defaultValue={defaultValue}
        required={required}
        minLength={PASSWORD_MIN}
        aria-describedby={showMeter ? meterId : undefined}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          onInput?.();
        }}
        onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
        onKeyDown={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
        // Only key events carry modifier state, so the warning can't appear
        // until the first keystroke — a focus event has nothing to read.
        onBlur={() => setCapsLock(false)}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={visible}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-ink-500 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            {visible ? (
              <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        }
      />

      <p
        role="status"
        aria-live="polite"
        className="flex items-center gap-1.5 text-xs font-medium text-accent-700"
      >
        {capsLock && (
          <>
            <span aria-hidden="true">⇪</span> Caps Lock is on
          </>
        )}
      </p>

      {showMeter && !error && (
        <div className="space-y-2 pt-0.5">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < score ? SEGMENT_COLORS[score] : "bg-ink-200"
                }`}
              />
            ))}
          </div>

          <p id={meterId} className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-700" aria-live="polite">
              {value ? `Strength: ${SCORE_LABELS[score]}` : "Strength: —"}
            </span>
            {remaining > 0 && value.length > 0 && (
              <span className="text-ink-500">
                {remaining} character{remaining === 1 ? "" : "s"} to go
              </span>
            )}
          </p>

          {value.length > 0 && passwordProblem(value) === null && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-success-700">
              {RULES.map((rule) => (
                <li key={rule} className="flex items-center gap-1">
                  <span aria-hidden="true">✓</span> {rule}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
