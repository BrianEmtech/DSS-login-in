import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/**
 * Page-level message banner. Errors use `role="alert"` so they're announced
 * immediately; success and info use `aria-live="polite"` so they don't steal
 * focus from whatever the user is doing.
 */
export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const config = {
    error: {
      wrap: "border-danger-500/30 bg-danger-50 text-danger-700",
      Icon: AlertTriangle,
      role: "alert" as const,
    },
    success: {
      wrap: "border-success-600/30 bg-success-50 text-success-700",
      Icon: CheckCircle2,
      role: "status" as const,
    },
    info: {
      wrap: "border-brand-600/25 bg-brand-50 text-brand-900",
      Icon: Info,
      role: "status" as const,
    },
  }[tone];

  const { Icon } = config;

  return (
    <div
      role={config.role}
      aria-live={tone === "error" ? "assertive" : "polite"}
      // Focusable only programmatically, so a page-level error that belongs to
      // no single field still has somewhere to send focus.
      tabIndex={-1}
      data-form-alert=""
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 ${config.wrap}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="leading-5">{children}</p>
    </div>
  );
}
