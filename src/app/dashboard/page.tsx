import { Logo } from "@/components/brand";
import { signOut } from "@/app/actions/auth";
import { verifySession } from "@/lib/dal";
import { Clock3, FileCheck2, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  // Reads the user from Django on every render, so a revoked role or a disabled
  // account stops working here immediately rather than at cookie expiry.
  const user = await verifySession();

  const stats = [
    { Icon: FileCheck2, label: "Open decisions", value: "12" },
    { Icon: Clock3, label: "Awaiting review", value: "4" },
    { Icon: TrendingUp, label: "Approved this quarter", value: "37" },
  ];

  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Welcome back, {user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-ink-600">
          Signed in as {user.email} &middot; {user.role}
          {user.organisation ? ` · ${user.organisation}` : ""}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          This is a placeholder screen. Swap it for your real DSS workspace.
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {stats.map(({ Icon, label, value }) => (
            <li key={label} className="rounded-xl border border-ink-200 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-3xl font-semibold text-ink-900">{value}</p>
              <p className="mt-1 text-sm text-ink-600">{label}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
