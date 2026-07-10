const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g;
const HIGH_RISK_TEXT_CHARACTERS = /[<>{}`]/g;

export type ValidationResult = {
  ok: boolean;
  message?: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): ValidationResult {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return { ok: false, message: "Email is required." };
  }

  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  return { ok: true };
}

export function validatePassword(password: string): ValidationResult {
  if (password.length < 10) {
    return { ok: false, message: "Use at least 10 characters." };
  }

  if (password.length > 128) {
    return { ok: false, message: "Password is too long." };
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { ok: false, message: "Use uppercase, lowercase, and a number." };
  }

  return { ok: true };
}

export function validateName(name: string): ValidationResult {
  const cleanName = sanitizeUserText(name, 80);

  if (cleanName.length < 2) {
    return { ok: false, message: "Enter your full name." };
  }

  return { ok: true };
}

export function validateOneTimeCode(code: string): ValidationResult {
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, message: "Enter the 6 digit verification code." };
  }

  return { ok: true };
}

export function sanitizeUserText(value: string, maxLength = 600) {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(HIGH_RISK_TEXT_CHARACTERS, "")
    .trim()
    .slice(0, maxLength);
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function getSafeExternalUrl(url: string, allowedHosts: readonly string[] = []) {
  try {
    const parsed = new URL(url);
    const hostAllowed =
      allowedHosts.length === 0 ||
      allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));

    if (parsed.protocol !== "https:" || !hostAllowed) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function createSessionNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
