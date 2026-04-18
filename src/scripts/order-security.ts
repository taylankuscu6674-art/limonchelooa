type GuardResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message?: string;
    };

const DEFAULT_MIN_DELAY_MS = 1600;
const DEFAULT_COOLDOWN_MS = 18000;
const FALLBACK_TOO_FAST_MESSAGE = "Please wait a moment before sending your request.";
const FALLBACK_COOLDOWN_MESSAGE = "Your request is already being prepared. Please try again shortly.";

const getNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getStoredTime = (key: string) => {
  try {
    return Number.parseInt(window.sessionStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
};

const setStoredTime = (key: string, value: number) => {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    // Private browsing or strict browser settings can block storage.
  }
};

export const prepareSecureForm = (form: HTMLFormElement) => {
  form.dataset.securityReadyAt = String(Date.now());
};

export const sanitizeForMessage = (value: string, maxLength = 500) =>
  value
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export const showGuardMessage = (form: HTMLFormElement, message: string) => {
  const status = form.querySelector<HTMLElement>("[data-security-status]");
  if (status) {
    status.textContent = message;
  }
  window.alert(message);
};

export const guardSecureSubmission = (form: HTMLFormElement): GuardResult => {
  const honeypot = form.querySelector<HTMLInputElement>("[data-security-honeypot]");
  if (honeypot && sanitizeForMessage(honeypot.value, 80)) {
    return { ok: false };
  }

  const now = Date.now();
  const readyAt = getNumber(form.dataset.securityReadyAt, 0);
  const minDelay = getNumber(form.dataset.securityMinDelayMs, DEFAULT_MIN_DELAY_MS);

  if (!readyAt || now - readyAt < minDelay) {
    return {
      ok: false,
      message: form.dataset.securityTooFast || FALLBACK_TOO_FAST_MESSAGE,
    };
  }

  const storageKey = form.dataset.securityKey || `kas-limoncello:${form.id || "order"}`;
  const cooldown = getNumber(form.dataset.securityCooldownMs, DEFAULT_COOLDOWN_MS);
  const lastSubmit = getStoredTime(storageKey);

  if (lastSubmit && now - lastSubmit < cooldown) {
    return {
      ok: false,
      message: form.dataset.securityCooldown || FALLBACK_COOLDOWN_MESSAGE,
    };
  }

  setStoredTime(storageKey, now);
  return { ok: true };
};

export const openSecureExternalUrl = (url: string) => {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    opened.opener = null;
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};
