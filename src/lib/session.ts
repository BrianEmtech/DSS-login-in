import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Session cookie handling.
 *
 * The cookie holds an opaque Django session key, signed so Next can reject a
 * tampered value before spending a request on it. It is NOT a self-contained
 * identity: `verifySession` always re-reads the user from Django, so revoking
 * a role or disabling an account takes effect immediately instead of waiting
 * for the cookie to expire.
 */

const COOKIE_NAME = "dss_session";
const RESET_COOKIE_NAME = "dss_reset";
const PENDING_COOKIE_NAME = "dss_pending";
const DEFAULT_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const RESET_TTL_SECONDS = 15 * 60; // matches RESET_TTL_MS in auth-store

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.startsWith("dev-only")) {
    // Loud in dev, fatal everywhere else.
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to a real value in production.");
    }
    console.warn(
      "[session] SESSION_SECRET is unset or still the placeholder. " +
        "Set one in .env.local before testing authentication.",
    );
  }
  return new TextEncoder().encode(secret ?? "dev-only-insecure-placeholder");
}

export async function createSession(
  token: string,
  options: {
    ttlSeconds?: number;
    /**
     * `true` writes a cookie with an expiry, so it survives a browser restart.
     * `false` omits the expiry entirely, making it a true session cookie that
     * the browser drops on close — which is what "don't keep me signed in"
     * has to mean on a shared machine.
     */
    persistent?: boolean;
  } = {},
): Promise<void> {
  const { ttlSeconds = DEFAULT_TTL_SECONDS, persistent = true } = options;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // The JWT always carries an expiry even when the cookie does not, so a
  // session cookie copied out of the browser still stops working.
  const signed = await new SignJWT({ token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(persistent ? { expires: expiresAt } : {}),
  });
}

/** Returns the Django session key, or null if absent/expired/forged. */
export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const { payload } = await jwtVerify(raw, secretKey(), { algorithms: ["HS256"] });
    const token = payload.token;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/* -------------------------------------------------------------------------- */
/* Password reset handoff                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Carries the reset token from the OTP step to the change-password step.
 *
 * A cookie rather than a query parameter: a token in the URL ends up in browser
 * history, server access logs and the `Referer` header of anything the page
 * links out to.
 */
export async function setResetToken(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(RESET_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESET_TTL_SECONDS,
  });
}

export async function readResetToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(RESET_COOKIE_NAME)?.value ?? null;
}

export async function clearResetToken(): Promise<void> {
  const jar = await cookies();
  jar.delete(RESET_COOKIE_NAME);
}

/* -------------------------------------------------------------------------- */
/* Pending verification                                                        */
/* -------------------------------------------------------------------------- */

export type PendingVerification = { email: string; purpose: "register" | "reset-password" };

/**
 * Remembers which address the OTP step is for.
 *
 * Deliberately not a query parameter. An email in the URL is an email in
 * browser history, access logs and `Referer` — and, worse, it lets a visitor
 * name any address they like and have the app treat it as a live challenge.
 */
export async function setPendingVerification(value: PendingVerification): Promise<void> {
  const jar = await cookies();
  jar.set(PENDING_COOKIE_NAME, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
}

export async function readPendingVerification(): Promise<PendingVerification | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingVerification>;
    if (typeof parsed.email !== "string" || !parsed.email) return null;
    const purpose = parsed.purpose === "register" ? "register" : "reset-password";
    return { email: parsed.email, purpose };
  } catch {
    return null;
  }
}

export async function clearPendingVerification(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE_NAME);
}
