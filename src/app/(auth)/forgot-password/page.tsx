import type { Metadata } from "next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Reset your password",
  description: "Request a verification code to reset your DSS password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
