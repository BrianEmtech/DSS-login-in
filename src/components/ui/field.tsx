import type { LucideIcon } from "lucide-react";
import { AlertCircle, ChevronDown } from "lucide-react";

/**
 * Text input with a visible label, optional leading icon, and an error message
 * that is wired up via `aria-describedby` so screen readers announce it.
 */
export function TextField({
  id,
  name,
  label,
  type = "text",
  icon: Icon,
  hint,
  error,
  defaultValue,
  trailing,
  labelAction,
  required = false,
  "aria-describedby": extraDescribedBy,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name"> & {
  id: string;
  name: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
  error?: string;
  defaultValue?: string;
  trailing?: React.ReactNode;
  /** Rendered at the right end of the label row (e.g. a "forgot password?" link). */
  labelAction?: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  // `aria-describedby` only, not `aria-describedby` + `aria-errormessage`
  // pointing at the same node: that reads the error out twice. Callers can
  // describe the input further (a strength meter, say) and it is merged in
  // rather than overwritten.
  const describedBy =
    [errorId, hintId, extraDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-ink-800">
          {label}
          {required && (
            <span className="ml-1 text-danger-600" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        )}

        <input
          {...props}
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "block min-h-11 w-full rounded-lg border bg-white text-ink-900",
            "placeholder:text-ink-400",
            "transition-[border-color,box-shadow] duration-200 ease-out",
            "focus-visible:outline-none",
            Icon ? "pl-10" : "pl-3.5",
            trailing ? "pr-11" : "pr-3.5",
            error
              ? "border-danger-500 focus-visible:border-danger-600 focus-visible:ring-2 focus-visible:ring-danger-500/30"
              : "border-ink-300 hover:border-ink-400 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25",
          ].join(" ")}
        />

        {trailing && (
          <div className="absolute top-1/2 right-1 -translate-y-1/2">{trailing}</div>
        )}
      </div>

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

/** Checkbox used for terms acceptance and "remember me". */
export function Checkbox({
  id,
  name,
  error,
  children,
  defaultChecked,
  onChange,
}: {
  id: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  defaultChecked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id={id}
          name={name}
          defaultChecked={defaultChecked}
          onChange={onChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={[
            "mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-ink-300 text-brand-700",
            "accent-brand-700",
            "transition-[border-color,box-shadow] duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-1",
            error ? "border-danger-500" : "hover:border-ink-400",
          ].join(" ")}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-5 text-ink-700">
          {children}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 pl-7 text-xs font-medium text-danger-700">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

/** Native `<select>` styled to match TextField. */
export function SelectField({
  id,
  name,
  label,
  options,
  error,
  defaultValue,
  required = false,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "name"> & {
  id: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  defaultValue?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="ml-1 text-danger-600" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      <div className="relative">
        <select
          {...props}
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={[
            "block min-h-11 w-full cursor-pointer appearance-none rounded-lg border bg-white",
            "pr-10 pl-3.5 text-ink-900",
            "transition-[border-color,box-shadow] duration-200 ease-out focus-visible:outline-none",
            error
              ? "border-danger-500 focus-visible:border-danger-600 focus-visible:ring-2 focus-visible:ring-danger-500/30"
              : "border-ink-300 hover:border-ink-400 focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/25",
          ].join(" ")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.value === ""}>
              {o.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium text-danger-700">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
