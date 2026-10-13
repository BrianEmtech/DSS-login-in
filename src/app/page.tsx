import { redirect } from "next/navigation";

/**
 * DSS has no public marketing site — the root opens straight on the auth flow.
 * `/login` bounces an already-signed-in user to `/dashboard`, so a single hop
 * here resolves both the anonymous and the authenticated case.
 */
export default function RootPage() {
  redirect("/login");
}