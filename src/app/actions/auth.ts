"use server";

import { redirect } from "next/navigation";

import {
  type Role,
  OTP_RESEND_COOLDOWN_MS,
  challengeCooldown,
  consumeChallenge,
  consumeResetToken,
  createChallenge,
  createUser,
  deleteChallenge,
  emailInUse,
  findChallenge,
  findUser,
  issueResetToken,
  updatePassword,
} from "@/lib/auth-store";
import { hashPassword } from "@/lib/password";
import { djangoLogin, djangoLogout } from "@/lib/django";
import {
  clearPendingVerification,
  clearResetToken,
  createSession,
  destroySession,
  readPendingVerification,
  readResetToken,
  readSessionToken,
  setPendingVerification,
  setResetToken,
} from "@/lib/session";
import {
  type FieldErrors,
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateOtp,
  validateRegister,
} from "@/lib/validation";

/** Shape every action returns to the client. */
export type AuthState = {
  ok: boolean;
  /** Field-level messages, keyed by input name. */
  errors?: FieldErrors;
  /** Page-level banner message. */
  message?: string;
  /** Non-sensitive values to repopulate the form after a failed submit. */
  values?: Record<string, string>;
  /** Where the client should go next (e.g. the OTP step). */
  next?: string;
  /** Seconds left on the resend cooldown. */
  retryIn?: number;
};

const ROLES: Role[] = ["Analyst", "Decision Maker", "Administrator", "Auditor"];

/**
 * In development the OTP is echoed back so the flow can be exercised without a
 * mail provider wired up. It must never reach a real user: anyone who can read
 * the response can complete a reset for any address they can name.
 */
function devCodeHint(code: string): string {
  return process.env.NODE_ENV === "production" ? "" : ` (Dev only: your code is ${code})`;
}

/** Shown whenever a code was (or would have been) sent. Never reveals whether the account exists. */
const CODE_SENT_MESSAGE =
  "If that address needs a code, one is on its way. Check your inbox and spam folder.";

const COOLDOWN_MESSAGE = (seconds: number) =>
  `A code was just sent. You can request another in ${seconds}s.`;

function toRole(value: FormDataEntryValue | null): Role | null {
  const v = String(value ?? "");
  return ROLES.find((r) => r === v) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  const token = await readSessionToken();
  await djangoLogout(token ?? undefined); // best-effort server-side cleanup
  await destroySession(); // local cookie always cleared, even if Django failed
  redirect("/login");
}

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

const GENERIC_LOGIN_ERROR =
  "We couldn't sign you in with those details. Check your email and password, or reset your password.";

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  // Cheap client-shared validation first, so an empty form doesn't cost a
  // round trip. Django re-validates regardless.
  const errors = validateLogin(email, password);
  if (Object.keys(errors).length) {
    return { ok: false, errors, values: { email } };
  }

  const result = await djangoLogin(email, password);

  if (!result.ok) {
    if (result.kind === "validation") {
      return { ok: false, errors: result.fields, values: { email } };
    }

    if (result.kind === "unavailable") {
      // Covers both an unreachable backend and a 5xx from it. Distinguishing
      // either from "wrong password" matters: a dev confusing the two is the
      // single most common failure here, and a generic message would send them
      // hunting for a typo in the password.
      return {
        ok: false,
        message:
          "The sign-in service isn't responding. Check that the backend is running, then try again.",
        values: { email },
      };
    }

    if (result.kind === "account_disabled") {
      return {
        ok: false,
        message: "This account has been disabled. Contact your administrator.",
        values: { email },
      };
    }

    if (result.kind === "rate_limited") {
      const minutes = Math.ceil(result.retryAfter / 60);
      return {
        ok: false,
        message: `Too many sign-in attempts. Try again in about ${minutes} minute${
          minutes === 1 ? "" : "s"
        }, or reset your password.`,
        values: { email },
      };
    }

    if (result.kind === "misconfigured") {
      // Never a user error: the shared secret between Next and Django is wrong
      // or missing, and no amount of retyping a password will fix it.
      return {
        ok: false,
        message:
          "Sign-in is misconfigured and the server rejected this request. Contact your administrator.",
        values: { email },
      };
    }

    return { ok: false, message: GENERIC_LOGIN_ERROR, values: { email } };
  }

  // 8 hours with "remember me". Without it, a cookie with no expiry at all, so
  // closing the browser ends the session.
  await createSession(result.token, {
    ttlSeconds: remember ? undefined : 60 * 60,
    persistent: remember,
  });
  redirect("/dashboard");
}

/* -------------------------------------------------------------------------- */
/* Register                                                                    */
/* -------------------------------------------------------------------------- */

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const organisation = String(formData.get("organisation") ?? "");
  const role = toRole(formData.get("role"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const terms = formData.get("terms") === "on";

  const errors = validateRegister({
    fullName,
    email,
    organisation,
    role: role ?? "",
    password,
    confirmPassword,
    terms,
  });

  if (Object.keys(errors).length) {
    return {
      ok: false,
      errors,
      values: { fullName, email, organisation, role: role ?? "" },
    };
  }

  const normalisedEmail = email.trim().toLowerCase();
  const next = "/verify";
  await setPendingVerification({ email: normalisedEmail, purpose: "register" });

  // A taken address gets the same response as a free one, so this form can't be
  // used to test which emails are registered. The duplicate is caught at
  // verification time instead, once the caller has proven they own the address.
  if (emailInUse(email)) {
    return { ok: true, next, message: CODE_SENT_MESSAGE };
  }

  const waitFor = challengeCooldown(email, "register");
  if (waitFor > 0) {
    return { ok: true, next, message: COOLDOWN_MESSAGE(waitFor), retryIn: waitFor };
  }

  const challenge = createChallenge({
    email,
    purpose: "register",
    draft: {
      fullName,
      organisation,
      role: role as Role,
      passwordHash: hashPassword(password),
    },
  });

  // TODO: hand `challenge.code` to your email/SMS provider here.
  return {
    ok: true,
    next,
    message: CODE_SENT_MESSAGE + devCodeHint(challenge.code),
  };
}

/* -------------------------------------------------------------------------- */
/* Forgot password                                                             */
/* -------------------------------------------------------------------------- */

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const errors = validateForgotPassword(email);
  if (Object.keys(errors).length) {
    return { ok: false, errors, values: { email } };
  }

  const normalisedEmail = email.trim().toLowerCase();
  const next = "/verify";
  await setPendingVerification({ email: normalisedEmail, purpose: "reset-password" });

  // Always report success: revealing which emails exist would leak user data.
  // The unknown-address branch still advances to the OTP step, otherwise the
  // difference in navigation would leak exactly what the message hides.
  if (!findUser(email)) {
    return { ok: true, next, values: { email }, message: CODE_SENT_MESSAGE };
  }

  const waitFor = challengeCooldown(email, "reset-password");
  if (waitFor > 0) {
    return { ok: true, next, values: { email }, message: COOLDOWN_MESSAGE(waitFor), retryIn: waitFor };
  }

  const challenge = createChallenge({ email, purpose: "reset-password" });

  return {
    ok: true,
    next,
    message: CODE_SENT_MESSAGE + devCodeHint(challenge.code),
  };
}

/* -------------------------------------------------------------------------- */
/* OTP verification                                                            */
/* -------------------------------------------------------------------------- */

export async function verifyOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const code = String(formData.get("code") ?? "");

  // Which address is being verified comes from the cookie set when the code was
  // requested, never from the submitted form — otherwise the caller chooses the
  // account the code applies to.
  const pending = await readPendingVerification();
  if (!pending) {
    return {
      ok: false,
      message: "This verification step has expired. Start again to get a new code.",
    };
  }

  const errors = validateOtp(code);
  if (Object.keys(errors).length) return { ok: false, errors };

  const result = consumeChallenge(pending.email, pending.purpose, code);

  if (!result.ok) {
    if (result.reason === "expired") {
      return { ok: false, message: "That code has expired. Request a new one to continue." };
    }
    if (result.reason === "locked") {
      return {
        ok: false,
        message: "Too many incorrect attempts. Request a new code to continue.",
      };
    }
    if (result.reason === "missing") {
      return {
        ok: false,
        message: "We couldn't find an active code for this address. Request a new one.",
      };
    }
    return { ok: false, errors: { code: "That code doesn't match. Check the digits and try again." } };
  }

  const challenge = result.challenge;
  deleteChallenge(challenge.id);
  await clearPendingVerification();

  if (challenge.purpose === "register" && challenge.draft) {
    // Checked here rather than on the register form: by this point the caller
    // has proven they control the address, so saying it is taken tells them
    // nothing they didn't already know.
    if (emailInUse(challenge.email)) {
      return {
        ok: false,
        message: "An account already exists for this email. Sign in instead, or reset your password.",
      };
    }

    const { fullName, organisation, role, passwordHash } = challenge.draft;
    createUser({
      fullName,
      email: challenge.email,
      organisation,
      role,
      passwordHash,
    });
    // Register is still on the in-memory store, so there's no Django session to
    // hand out. Send them to sign in rather than faking a session — this path
    // gets replaced when register moves to Postgres.
    redirect("/login?registered=1");
  }

  // Handed over in an httpOnly cookie, not a query parameter, so the token
  // stays out of history, logs and `Referer`.
  await setResetToken(issueResetToken(challenge.email));
  redirect("/change-password");
}

/**
 * Issues a fresh code for the same purpose/email pair.
 *
 * Only ever refreshes a challenge that is already in flight. Minting one here
 * would let an unauthenticated caller name any address, receive a usable code,
 * and walk straight to the change-password step.
 */
export async function resendOtp(): Promise<AuthState> {
  const pending = await readPendingVerification();
  if (!pending) {
    return {
      ok: false,
      message: "This verification step has expired. Start again to get a new code.",
    };
  }

  const { email: normalizedEmail, purpose: normalizedPurpose } = pending;

  // Carry the pending sign-up metadata across, otherwise a resent code would
  // verify successfully but have nothing to create an account from.
  const existing = findChallenge(normalizedEmail, normalizedPurpose);
  if (!existing) {
    return {
      ok: false,
      message: "We couldn't find an active code for this address. Start again to get a new one.",
    };
  }

  const waitFor = challengeCooldown(normalizedEmail, normalizedPurpose);
  if (waitFor > 0) {
    return { ok: false, message: COOLDOWN_MESSAGE(waitFor), retryIn: waitFor };
  }

  const challenge = createChallenge({
    email: normalizedEmail,
    purpose: normalizedPurpose,
    draft: existing.draft,
  });

  return {
    ok: true,
    message: CODE_SENT_MESSAGE + devCodeHint(challenge.code),
    retryIn: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
  };
}

/* -------------------------------------------------------------------------- */
/* Change password                                                             */
/* -------------------------------------------------------------------------- */

export async function changePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const errors = validateChangePassword({ newPassword, confirmPassword });
  if (Object.keys(errors).length) return { ok: false, errors };

  // Read from the cookie set at the end of the OTP step, never from the form:
  // a token in a form field is a token the page could have been handed by
  // someone else.
  const token = await readResetToken();
  const record = token ? consumeResetToken(token) : null;
  if (!record) {
    await clearResetToken();
    return {
      ok: false,
      message:
        "This reset link has expired or has already been used. Request a new code to start again.",
    };
  }

  updatePassword(record.email, hashPassword(newPassword));
  await clearResetToken();

  // Changing the password ends whatever session this browser was holding, so a
  // reset performed because of a suspected compromise doesn't leave one open.
  const sessionToken = await readSessionToken();
  if (sessionToken) {
    await djangoLogout(sessionToken);
    await destroySession();
  }

  redirect("/login?reset=1");
}
