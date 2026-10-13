/**
 * In-memory auth store — a stand-in for your real database + SMS/email provider.
 *
 * Everything lives in the Node process, so state resets when the dev server
 * restarts. Swap the functions below for your ORM / auth provider; the server
 * actions in `src/app/actions/auth.ts` are the only callers, so nothing else
 * needs to change.
 */

import { randomInt, randomUUID } from "node:crypto";

export type Role = "Analyst" | "Decision Maker" | "Administrator" | "Auditor";

export type User = {
  id: string;
  fullName: string;
  email: string;
  organisation: string;
  role: Role;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: number;
};

export type ChallengePurpose = "register" | "reset-password";

type Challenge = {
  id: string;
  email: string;
  code: string;
  purpose: ChallengePurpose;
  expiresAt: number;
  attemptsLeft: number;
  /** When the current code was issued. Drives the resend cooldown. */
  lastSentAt: number;
  /** Carries sign-up metadata while purpose === "register". */
  draft?: { fullName: string; organisation: string; role: Role; passwordHash: string };
};

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes
/** Minimum gap between two codes for the same email+purpose. */
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

const users = new Map<string, User>();
const challenges = new Map<string, Challenge>();
/** Recovery tokens issued after a successful OTP verification. */
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

function normalise(email: string) {
  return email.trim().toLowerCase();
}

export function findUser(email: string) {
  return users.get(normalise(email));
}

export function emailInUse(email: string) {
  return users.has(normalise(email));
}

export function createUser(input: {
  fullName: string;
  email: string;
  organisation: string;
  role: Role;
  passwordHash: string;
}): User {
  const user: User = {
    id: randomUUID(),
    fullName: input.fullName.trim(),
    email: normalise(input.email),
    organisation: input.organisation.trim(),
    role: input.role,
    passwordHash: input.passwordHash,
    emailVerified: true,
    createdAt: Date.now(),
  };
  users.set(user.email, user);
  return user;
}

export function updatePassword(email: string, passwordHash: string) {
  const user = users.get(normalise(email));
  if (!user) return null;
  user.passwordHash = passwordHash;
  return user;
}

/**
 * Seconds a caller must wait before another code may be issued for this
 * email+purpose. 0 when a new code can be sent right now.
 *
 * Enforced here rather than in the UI: the countdown on the verify screen is
 * component state, so a page reload clears it and the action would otherwise
 * mint codes as fast as they can be requested.
 */
export function challengeCooldown(email: string, purpose: ChallengePurpose): number {
  const existing = findChallenge(email, purpose);
  if (!existing) return 0;
  const elapsed = Date.now() - existing.lastSentAt;
  if (elapsed >= OTP_RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
}

/** Creates a 6-digit OTP challenge and returns it along with the new code. */
export function createChallenge(input: {
  email: string;
  purpose: ChallengePurpose;
  draft?: Challenge["draft"];
}) {
  // One live challenge per email+purpose; issuing a new code invalidates the old.
  // The replaced challenge's remaining attempts carry over, so re-sending can't
  // be used to refresh the guess budget and brute-force the 6-digit space.
  const previous = findChallenge(input.email, input.purpose);
  for (const [id, c] of challenges) {
    if (c.email === normalise(input.email) && c.purpose === input.purpose) {
      challenges.delete(id);
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const challenge: Challenge = {
    id: randomUUID(),
    email: normalise(input.email),
    code,
    purpose: input.purpose,
    expiresAt: Date.now() + OTP_TTL_MS,
    attemptsLeft: previous?.attemptsLeft ?? OTP_MAX_ATTEMPTS,
    lastSentAt: Date.now(),
    draft: input.draft ?? previous?.draft,
  };
  challenges.set(challenge.id, challenge);
  return challenge;
}

export function findChallenge(email: string, purpose: ChallengePurpose) {
  const key = normalise(email);
  for (const c of challenges.values()) {
    if (c.email === key && c.purpose === purpose) return c;
  }
  return undefined;
}

export type OtpResult =
  | { ok: true; challenge: Challenge }
  | { ok: false; reason: "expired" | "mismatch" | "locked" | "missing" };

export function consumeChallenge(
  email: string,
  purpose: ChallengePurpose,
  code: string,
): OtpResult {
  const challenge = findChallenge(email, purpose);
  if (!challenge) return { ok: false, reason: "missing" };
  if (Date.now() > challenge.expiresAt) {
    challenges.delete(challenge.id);
    return { ok: false, reason: "expired" };
  }
  if (challenge.attemptsLeft <= 0) {
    challenges.delete(challenge.id);
    return { ok: false, reason: "locked" };
  }
  if (challenge.code !== code) {
    challenge.attemptsLeft -= 1;
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true, challenge };
}

export function deleteChallenge(id: string) {
  challenges.delete(id);
}

export function issueResetToken(email: string) {
  const token = randomUUID();
  resetTokens.set(token, {
    email: normalise(email),
    expiresAt: Date.now() + RESET_TTL_MS,
  });
  return token;
}

export function consumeResetToken(token: string) {
  const record = resetTokens.get(token);
  if (!record) return null;
  resetTokens.delete(token); // single use
  if (Date.now() > record.expiresAt) return null;
  return record;
}
