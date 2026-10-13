import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
  "transition-[background-color,color,box-shadow,border-color] duration-200 ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-55 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white shadow-sm hover:bg-brand-800 active:bg-brand-900 " +
    "focus-visible:outline-brand-700 disabled:hover:bg-brand-700",
  secondary:
    "border border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50 " +
    "active:bg-ink-100 focus-visible:outline-ink-500",
  ghost:
    "text-brand-800 hover:bg-brand-50 active:bg-brand-100 focus-visible:outline-brand-700",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-700 " +
    "focus-visible:outline-danger-600",
};

const sizes: Record<Size, string> = {
  // Every size clears the 44px minimum touch target.
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-base",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
} = {}) {
  return [base, variants[variant], sizes[size], fullWidth ? "w-full" : ""].filter(Boolean).join(" ");
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  pending = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  pending?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || pending}
      aria-busy={pending || undefined}
      className={`${buttonClass({ variant, size, fullWidth })} ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
