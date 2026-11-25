# UII LMS — password-recovery OTP expiry / preview fallback

Incident reported 26 November 2026. Reported URL:
`https://uii-design-thinking-hub-preview.vercel.app/#error=access_denied&error_code=otp_expired...`

## Verified diagnosis (without identifying users or disclosing tokens)

- Correct Supabase Auth project: `dpapvhvceuoegztxfuuu` (`usi-design-thinking-hub`), **not** `aignaxmirbbnfuutvvdg` (ATH_Research).
- Vercel's `NEXT_PUBLIC_SUPABASE_URL` matches the UII LMS project.
- UII Auth logs (2026-11-25 UTC) show `POST /recover` 200 at 18:36:10, `/verify` 303 with login at 18:36:18, and `/verify` 303 with error `One-time token not found` at 18:36:23. This is consistent with opening the same single-use email link more than once (including email scanner prefetch). The log alone cannot identify who clicked.
- Forgot-password now explicitly chooses `https://uii-dt-thanh-pilot.vercel.app/reset-password` as the canonical recovery destination when called from the named preview, staging, or pilot URLs. Signup/OAuth stay on their existing redirect policy. The pilot URL must be in Supabase's allowed redirects list; until the dashboard setting is saved, Supabase may still fall back to the configured Site URL.
- Existing browser client uses `detectSessionInUrl: true`. The recovery request already supplies `redirectTo` pointing to the named staging host and `/reset-password`. A link landing at the old preview root instead of the reset screen suggests either Site URL fallback or a hardcoded/rebuilt email template; this is **not confirmed** until URL Configuration and recovery template are inspected.
- Supabase project was healthy during read-only inspection. No LMS records, auth configuration or secrets changed.

## Application-side protection in candidate branch

1. Route recovery requests from older UII preview and staging URLs to the maintained pilot `/reset-password`, without changing signup and OAuth redirects.
2. Handle `/#error=access_denied&error_code=otp_expired` by showing `/forgot-password?reason=expired` with a safe retry, not the public landing page.
3. Handle a new recovery email template that links directly to `/reset-password#token_hash=...&type=recovery`: do **not** consume it on page load, strip its fragment immediately, and verify it only when the user explicitly presses **Continue to reset password**. This prevents automatic email-link GET/prefetch from consuming the OTP.
4. Preserve compatibility with existing Supabase `ConfirmationURL` recovery links, including `PASSWORD_RECOVERY` sessions. A generic signed-in user cannot update passwords through the recovery form without a recovery event/session.
5. UI uses English and does not reveal account existence.

## Required Supabase Dashboard operator action (not available through connected tools)

Open [UII LMS Authentication URL Configuration](https://supabase.com/dashboard/project/dpapvhvceuoegztxfuuu/auth/url-configuration).

- **Site URL:** `https://uii-design-thinking-hub-staging.vercel.app` (approved stable UII staging origin).
- **Allowed Redirect URLs**, exact:
  - `https://uii-design-thinking-hub-staging.vercel.app/learn`
  - `https://uii-design-thinking-hub-staging.vercel.app/reset-password`
  - `https://uii-dt-thanh-pilot.vercel.app/learn`
  - `https://uii-dt-thanh-pilot.vercel.app/reset-password`
- Do not use a wildcard covering all vercel.app sites or a broad open redirect. Keep the older preview host only if actively required for backwards compatibility; do not use it as Site URL.

Then open [UII LMS Authentication Email Templates](https://supabase.com/dashboard/project/dpapvhvceuoegztxfuuu/auth/templates) and edit **Reset Password** (recovery) to replace the usual `{{ .ConfirmationURL }}` with a link to the browser click-to-verify flow:

```html
<h2>Reset your UII password</h2>
<p>If you requested a password reset, click the button below. You will confirm the recovery on the next screen.</p>
<p><a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery">Continue to reset your password</a></p>
<p>If you did not request this, ignore this message. Never share this email link.</p>
```

Template caveats:
- Save the exact HTML in the **Recovery** email template, not signup confirmation or magic-link templates.
- `RedirectTo` must refer to the approved `/reset-password` route; ensure the template does not construct a stale preview `SiteURL` link.
- If `RedirectTo` isn't set by a client or isn't allowlisted, correct the client/URL Configuration before releasing. Do **not** place `{{ .TokenHash }}` in query strings routed through logging/analytics.
- Use `#token_hash` deliberately: fragments aren't sent to the app server on HTTP GET. Application Javascript removes this fragment before verification. Opening a link alone does not consume the token.
- Do not test with real student identities. Use a dedicated test account, password manager, and new password not reused elsewhere.

## Required proof before claiming full fix

1. New recovery email shows the stable UII `/reset-password` URL and never the preview root.
2. Opening the email shows **Confirm password recovery**, without consuming OTP on HTTP GET.
3. Clicking Continue shows **Choose a new password**; updating it yields **Password updated**; sign-in with the new password succeeds.
4. Reloading or clicking the old link shows **Invalid or expired link** with the new-email button.
5. A second fresh email can be requested without exposing account existence; rate-limit errors are truthful.
6. Repeat in mobile browser and email client with link protection/scanning on. Verify the documented candidate commit, Vercel alias and GitHub CI checks.

This commit is a source-side mitigation, **not** proof that Supabase's hosted Auth URL Configuration or recovery email template was updated. Those dashboard steps and a real-email end-to-end test are release gates.
