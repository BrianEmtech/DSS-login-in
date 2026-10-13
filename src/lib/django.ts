import "server-only";

/**
 * Typed client for the Django backend.
 *
 * Server-only on purpose. These calls carry the session token, so they must
 * never run in the browser — that would hand the token to client JS.
 *
 * Talks to DJANGO_INTERNAL_URL directly. There is deliberately no Next rewrite
 * in front of it: every call here is server-to-server, so a rewrite would only
 * add a round trip through the Next server and an Authorization header to
 * forward by hand. Add one only if a browser-initiated call ever needs it.
 */

const DJANGO_URL = process.env.DJANGO_INTERNAL_URL ?? "http://localhost:8000";

/**
 * Shared secret proving a call came from this server rather than a browser.
 * It is what makes the CSRF exemption on the Django auth views safe, so a
 * missing value is a configuration error, not something to paper over.
 */
function internalToken(): string {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("INTERNAL_API_TOKEN must be set to reach the API.");
    }
    console.warn("[django] INTERNAL_API_TOKEN is unset — API calls will be rejected.");
  }
  return token ?? "";
}

/** Thrown on a transport failure so callers can tell it apart from a 401. */
export class DjangoUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DjangoUnavailableError";
  }
}

export type DjangoRole = "Analyst" | "Decision Maker" | "Administrator" | "Auditor";

export type SessionUser = {
  id: number;
  email: string;
  fullName: string;
  organisation: string;
  role: DjangoRole;
  isActive: boolean;
};

export type LoginResult =
  | { ok: true; token: string; user: SessionUser }
  | { ok: false; kind: "validation"; fields: Record<string, string> }
  | { ok: false; kind: "invalid_credentials" }
  | { ok: false; kind: "account_disabled" }
  | { ok: false; kind: "rate_limited"; retryAfter: number }
  | { ok: false; kind: "misconfigured" }
  | { ok: false; kind: "unavailable" };

async function djangoFetch(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<Response> {
  const { token, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Internal-Token", internalToken());
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    return await fetch(`${DJANGO_URL}/api/v1${path}`, { ...rest, headers, cache: "no-store" });
  } catch (cause) {
    throw new DjangoUnavailableError(
      `Could not reach Django at ${DJANGO_URL}. Is it running?`,
      { cause },
    );
  }
}

export async function djangoLogin(email: string, password: string): Promise<LoginResult> {
  let response: Response;
  try {
    response = await djangoFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (error instanceof DjangoUnavailableError) return { ok: false, kind: "unavailable" };
    throw error;
  }

  if (response.ok) {
    const data = (await response.json()) as { token: string; user: SessionUser };
    return { ok: true, token: data.token, user: data.user };
  }

  if (response.status === 400) {
    const data = (await response.json()) as { fields?: Record<string, string> };
    return { ok: false, kind: "validation", fields: data.fields ?? {} };
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After")) || 900;
    return { ok: false, kind: "rate_limited", retryAfter };
  }

  if (response.status === 403) {
    // The view returns 403 both for a disabled account and for a rejected
    // shared secret. The body tells them apart, and confusing the two would
    // send an operator hunting through user records for a config problem.
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (data.error === "forbidden") return { ok: false, kind: "misconfigured" };
    return { ok: false, kind: "account_disabled" };
  }

  // A 5xx means the backend is broken, and reporting it as bad credentials
  // sends you hunting for a typo in the password instead. Account enumeration
  // is about telling 401 apart from 200/404 on the *same* request, so
  // surfacing server faults separately costs nothing there.
  if (response.status >= 500) return { ok: false, kind: "unavailable" };

  // 401 and any other unexpected 4xx collapse to invalid_credentials so the
  // status can't leak whether an account exists.
  return { ok: false, kind: "invalid_credentials" };
}

export type MeResult =
  | { ok: true; user: SessionUser }
  | { ok: false; kind: "unauthenticated" }
  | { ok: false; kind: "unavailable" };

/**
 * Re-reads the user from Django.
 *
 * Distinguishes "this session is no longer valid" from "the backend didn't
 * answer". Collapsing the two signs everyone out whenever the API hiccups.
 */
export async function djangoMe(token: string | undefined): Promise<MeResult> {
  if (!token) return { ok: false, kind: "unauthenticated" };

  let response: Response;
  try {
    response = await djangoFetch("/auth/me", { token });
  } catch {
    return { ok: false, kind: "unavailable" };
  }

  if (response.status === 401) return { ok: false, kind: "unauthenticated" };
  if (!response.ok) return { ok: false, kind: "unavailable" };

  const data = (await response.json()) as { user: SessionUser };
  return { ok: true, user: data.user };
}

/** Best-effort. A failed logout still clears the local cookie. */
export async function djangoLogout(token: string | undefined): Promise<void> {
  if (!token) return;
  try {
    await djangoFetch("/auth/logout", { method: "POST", token });
  } catch {
    // Nothing useful to do; the cookie is removed either way.
  }
}