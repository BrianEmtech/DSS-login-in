import type { Metadata } from "next";

import { FormAlert } from "@/components/ui/form-alert";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DSS handles personal data.",
};

export default function PrivacyPage() {
  return (
    <article className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Privacy Policy</h1>

      <FormAlert tone="info">
        Placeholder. This page exists so the consent checkbox on the sign-up form links
        somewhere real — the wording below has not been reviewed and is not binding. Replace
        it with your counsel&apos;s text before launch.
      </FormAlert>

      <div className="space-y-5 text-ink-700">
        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            1. What we collect
          </h2>
          <p className="leading-relaxed">
            Account details you provide at sign-up (name, work email, organisation, role),
            and a record of the decisions you create, review or approve.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            2. Why we hold it
          </h2>
          <p className="leading-relaxed">
            To authenticate you, to apply your organisation&apos;s access rules, and to
            maintain the audit history that makes a decision record meaningful.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">3. Retention</h2>
          <p className="leading-relaxed">
            Decision records are retained for as long as your organisation&apos;s retention
            policy requires. Because the history is append-only, your name may remain
            attached to decisions you made after your account is closed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">4. Your rights</h2>
          <p className="leading-relaxed">
            Contact your organisation&apos;s administrator to access, correct or export the
            personal data held about you.
          </p>
        </section>
      </div>
    </article>
  );
}
