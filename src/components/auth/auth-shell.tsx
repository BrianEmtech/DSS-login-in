import { Logo, LogoMark } from "@/components/brand";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";

const PROOF_POINTS = [
  {
    Icon: Sparkles,
    title: "Evidence behind every call",
    body: "Each recommendation links back to the model, weights and data that produced it.",
  },
  {
    Icon: Workflow,
    title: "Repeatable, reviewable process",
    body: "Standardise how decisions are framed, challenged and recorded across teams.",
  },
  {
    Icon: ShieldCheck,
    title: "Audit-ready by default",
    body: "Immutable history of who decided what, when, and on which version of the data.",
  },
];

/**
 * Two-column shell for the auth flow: a dark trust panel on desktop, the form
 * on the right. On mobile the panel collapses to a compact brand header.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Overrides the default trust panel bullets. */
  aside?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Trust panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="grid-pattern absolute inset-0" aria-hidden="true" />
        <div
          className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-3xl leading-tight font-semibold text-white xl:text-4xl">
            Make better decisions, and show your work.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink-300">
            DSS brings models, data and accountability into one workspace — so your team
            spends less time arguing and more time deciding.
          </p>

          <ul className="mt-10 space-y-5">
            {PROOF_POINTS.map(({ Icon, title: t, body }) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                  <Icon className="h-[18px] w-[18px] text-accent-400" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          {aside}
        </div>

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-400">
          <span>© {new Date().getFullYear()} DSS</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            SOC 2 Type II · ISO 27001
          </span>
        </div>
      </aside>

      {/* Form column */}
      <main id="main" className="flex min-h-dvh flex-col">
        {/* Compact brand header — mobile/tablet */}
        <header className="px-5 py-6 sm:px-8 lg:hidden">
          <LogoMark variant="dark" />
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-[32px]">
                {title}
              </h1>
              {description && (
                <p className="mt-3 text-base leading-relaxed text-ink-600">{description}</p>
              )}

              <div className="mt-8">{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
