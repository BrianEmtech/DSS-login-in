import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { djangoMe } from "@/lib/django";
import { readSessionToken } from "@/lib/session";
import type { SessionUser } from "@/lib/django";

/**
 * Data Access Layer: the single place authorisation is decided.
 *
 * Everything that reads user data calls through here, so a forgotten check is
 * not possible. `cache` dedupes these within one render pass — without it the
 * dashboard's layout and page would each hit Django for the same user.
 *
 * Roles are always re-fetched from Django rather than trusted from the cookie.
 * A cookie that carried the role would keep granting permissions after an
 * admin revoked one.
 */

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;

  const result = await djangoMe(token);
  if (!result.ok) return null;

  const { user } = result;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    organisation: user.organisation,
    role: user.role,
    isActive: user.isActive,
  };
});

/**
 * For pages that should not render at all without a session.
 *
 * A backend outage is reported as an outage rather than silently redirecting to
 * the sign-in page: bouncing a signed-in user to /login when their session is
 * perfectly valid reads as "you have been logged out", and they would sign in
 * again against the same unreachable backend.
 */
export const verifySession = cache(async () => {
  const token = await readSessionToken();
  if (!token) redirect("/login");

  const result = await djangoMe(token);
  if (!result.ok) {
    if (result.kind === "unavailable") {
      throw new Error("The account service is unavailable. Please try again shortly.");
    }
    redirect("/login");
  }

  return result.user;
});