export function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    sessionStorage.removeItem(key);
    return fallback;
  }
}

export function writeSessionJson<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private or locked-down browser contexts.
  }
}

export function removeSessionJson(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Storage may be unavailable in private or locked-down browser contexts.
  }
}
