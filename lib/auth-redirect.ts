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
