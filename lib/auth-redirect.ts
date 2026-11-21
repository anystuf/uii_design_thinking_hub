/** Keep email verification callbacks on a stable allowed staging host, not a per-commit preview. */
export function authRedirectUrl(origin: string, pathname: string): string {
  const url = new URL(origin);
  const stagingPreview = /^usi-design-thinking-web-staging-[^.]+\.vercel\.app$/i.test(url.hostname);
  const destination = stagingPreview ? "https://usi-design-thinking-web-staging.vercel.app" : url.origin;
  return new URL(pathname, destination).toString();
}
