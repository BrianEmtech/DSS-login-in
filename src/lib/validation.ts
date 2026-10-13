/**
 * Shared validation helpers for the DSS auth flow.
 * Kept dependency-free so it runs identically on the server (actions)
 * and on the client (inline field validation).
 */

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Minimum rules: 8+ chars, one letter, one digit. */
export const PASSWORD_MIN = 8;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function passwordProblem(value: string): string | null {
  if (value.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (!/[a-zA-Z]/.test(value)) {
    return "Password must contain at least one letter.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password must contain at least one number.";
  }
  return null;
}

/** FIPS-style strength score, 0–4, shown as a 4-segment meter. */
export function passwordScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

export const SCORE_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!isEmail(email)) {
    errors.email = "Enter a valid email address, e.g. name@organisation.org.";
  }
  if (!password) {
    errors.password = "Password is required.";
  }
  return errors;
}

export function validateRegister(input: {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  const email = input.email.trim();

  if (!input.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (input.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!email) {
    errors.email = "Work email is required.";
  } else if (!isEmail(email)) {
    errors.email = "Enter a valid email address, e.g. name@organisation.org.";
  }

  if (!input.organisation.trim()) {
    errors.organisation = "Organisation is required.";
  }

  if (!input.role) {
    errors.role = "Select your role.";
  }

  const pwProblem = passwordProblem(input.password);
  if (!input.password) {
    errors.password = "Password is required.";
  } else if (pwProblem) {
    errors.password = pwProblem;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!input.terms) {
    errors.terms = "You must accept the terms to create an account.";
  }

  return errors;
}

export function validateForgotPassword(email: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!isEmail(email)) {
    errors.email = "Enter a valid email address, e.g. name@organisation.org.";
  }
  return errors;
}

export function validateOtp(code: string): FieldErrors {
  if (!code) return { code: "Enter the 6-digit code." };
  if (!/^\d{6}$/.test(code)) {
    return { code: "The code must be exactly 6 digits." };
  }
  return {};
}

export function validateChangePassword(input: {
  newPassword: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const pwProblem = passwordProblem(input.newPassword);

  if (!input.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (pwProblem) {
    errors.newPassword = pwProblem;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
