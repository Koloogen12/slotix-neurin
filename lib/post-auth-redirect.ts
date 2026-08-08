const KEY = "slotix-post-auth-redirect";

/**
 * Where to send someone once auth (and, for a brand-new account, onboarding) is done.
 * An invited person signs up from the invite page, so without this they finish onboarding
 * in the cabinet and never actually join the team they were invited to.
 */
export function rememberPostAuthRedirect(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // private mode — fall back to the default destination
  }
}

export function takePostAuthRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    if (path) sessionStorage.removeItem(KEY);
    return path;
  } catch {
    return null;
  }
}
