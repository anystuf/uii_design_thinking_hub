/** Confirm signups on a stable UII host instead of a short-lived Vercel preview. */
export const UII_STAGING_ORIGIN = "https://uii-design-thinking-hub-staging.vercel.app";

export function authRedirectUrl(origin: string, pathname: string): string {
  const url = new URL(origin);
  // The Vercel deployment slug can differ from the user-facing UII brand.
  // Recognize project previews by shape, without embedding old hostnames.
  const isStagingDeploymentPreview =
    url.hostname.endsWith(".vercel.app") &&
    /design-thinking.*-staging-[a-z0-9]+-[a-z0-9-]+\.vercel\.app$/i.test(url.hostname);
  const isNamedPreview = url.hostname === "uii-design-thinking-hub-preview.vercel.app";
  const destination = (isStagingDeploymentPreview || isNamedPreview)
    ? UII_STAGING_ORIGIN : url.origin;
  return new URL(pathname, destination).toString();
}

/**
 * Password recovery must finish on the actively maintained classroom pilot,
 * not an older preview/staging bundle which cannot handle token-hash emails.
 * Keep signup/OAuth redirects unchanged. Keep localhost isolated for tests.
 */
export const UII_RECOVERY_ORIGIN = "https://uii-dt-thanh-pilot.vercel.app";

export function passwordRecoveryRedirectUrl(origin: string): string {
  const current = authRedirectUrl(origin, '/reset-password');
  const resolved = new URL(current);
  if (resolved.origin === UII_STAGING_ORIGIN || resolved.origin === UII_RECOVERY_ORIGIN) {
    return new URL('/reset-password', UII_RECOVERY_ORIGIN).toString();
  }
  return current;
}
