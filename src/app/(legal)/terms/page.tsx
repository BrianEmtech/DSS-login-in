import type { Metadata } from "next";

import { FormAlert } from "@/components/ui/form-alert";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of the DSS workspace.",
};

export default function TermsPage() {
  return (
    <article className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Terms of Service</h1>

      <FormAlert tone="info">
        Placeholder. This page exists so the consent checkbox on the sign-up form links
        somewhere real — the wording below has not been reviewed and is not binding. Replace
        it with your counsel&apos;s text before launch.
      </FormAlert>

      <div className="space-y-5 text-ink-700">
        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">1. Your account</h2>
          <p className="leading-relaxed">
            Accounts are issued to named individuals within a subscribing organisation.
            You are responsible for keeping your credentials confidential and for activity
            carried out under your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            2. Acceptable use
          </h2>
          <p className="leading-relaxed">
            DSS supports decision records that may be relied on by others. Do not upload
            data you are not authorised to share, and do not misrepresent the provenance of
            a model, dataset or recommendation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            3. Decision records
          </h2>
          <p className="leading-relaxed">
            Decision history is retained to support audit. Records are immutable once
            committed; corrections are recorded as new entries rather than edits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">4. Termination</h2>
          <p className="leading-relaxed">
            Your organisation&apos;s administrator may revoke access at any time. Revocation
            takes effect on your next request.
          </p>
        </section>
      </div>
    </article>
  );
}
