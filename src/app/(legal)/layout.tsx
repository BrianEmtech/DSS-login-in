import { Logo } from "@/components/brand";
import Link from "next/link";

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-white">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-ink-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Logo href="/login" />
          <Link
            href="/register"
            className="rounded-lg px-2 py-1 text-sm font-medium text-ink-600 transition-colors duration-200 hover:text-brand-800"
          >
            Back to sign up
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        {children}
      </main>
    </div>
  );
}
