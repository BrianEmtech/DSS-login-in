import type { SessionUser } from "@/lib/django";
import { getSessionUser } from "@/lib/dal";

/**
 * Capability map for the four DSS roles.
 *
 * This drives UI visibility only — hiding a button. Every one of these must
 * also be enforced in Django before the real API exists, or the check can be
 * bypassed by calling the endpoint directly.
 */

export type Permission =
  | "case.read"
  | "decision.write"
  | "report.export"
  | "audit.read"
  | "user.manage";

export const ROLE_PERMISSIONS: Record<SessionUser["role"], readonly Permission[]> = {
  Analyst: ["case.read", "report.export"],
  "Decision Maker": ["case.read", "decision.write", "report.export"],
  Administrator: ["case.read", "decision.write", "report.export", "audit.read", "user.manage"],
  Auditor: ["case.read", "audit.read"],
};

export function can(role: SessionUser["role"], permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Convenience for Server Components. */
export async function currentUserCan(permission: Permission): Promise<boolean> {
  const user = await getSessionUser();
  return user ? can(user.role, permission) : false;
}