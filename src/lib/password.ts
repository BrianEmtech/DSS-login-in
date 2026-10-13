import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Password hashing with PBKDF2-SHA256.
 *
 * Self-hosted and dependency-free. If you later move to Auth.js, bcrypt/argon2,
 * or an identity provider, replace these two functions — callers are unchanged.
 */

const ITERATIONS = 210_000; // OWASP guidance for PBKDF2-HMAC-SHA256
const KEY_LENGTH = 64;
const DIGEST = "sha256";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(plain, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2$${ITERATIONS}$${salt}$${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, iterations, salt, expected] = stored.split("$");
  if (scheme !== "pbkdf2" || !salt || !expected) return false;

  const actual = pbkdf2Sync(
    plain,
    salt,
    Number(iterations),
    KEY_LENGTH,
    DIGEST,
  ).toString("hex");
  const a = Buffer.from(actual, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
