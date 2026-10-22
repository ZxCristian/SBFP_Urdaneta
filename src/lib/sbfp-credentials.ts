/**
 * Credential rules shared by the app that ISSUES accounts (the Division Office
 * console) and the app that CHECKS them (the server).
 *
 * Deliberately dependency-free and safe in the browser: the accounts panel needs
 * to generate a temporary password and validate the form before it is sent, and
 * the server re-validates the same rules with the same functions.
 */

/** Shortest password the Division Office may issue. Matches Better Auth's default. */
export const MIN_PASSWORD_LENGTH = 8;

/** Conservative enough for an internal division tool, and typed by hand. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length <= 254 && EMAIL_RE.test(email);
}

/** Why a password is unusable, or null when it is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) return "That password is too long.";
  return null;
}

/**
 * No 0/O or 1/l/I: these get read off a printed slip and typed by a teacher who
 * is not a sysadmin, and `0` vs `O` is exactly the call that gets made wrong.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A readable one-off password, e.g. `Km7t-Rq4w`, to hand to a teacher. */
export function generateTempPassword(): string {
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
    ).join("");
  return `${pick(4)}-${pick(4)}`;
}
