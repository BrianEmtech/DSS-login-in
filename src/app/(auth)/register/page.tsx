import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Create your account",
  description: "Request access to a DSS workspace.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
