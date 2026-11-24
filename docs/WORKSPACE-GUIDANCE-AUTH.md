# Workspace, authentication and guidance update

The workspace uses compact navigation and role-specific guidance. The first course action is near the top of the Student dashboard. Selecting a course in the catalogue moves keyboard focus and scroll position to its details.

The guide lists common questions for each server-derived role. It opens as a dialog, links directly to the relevant screen, and requires no external chat service.

## Enable Google on staging

1. Create a Web OAuth client in the Google Cloud project dedicated to this LMS. Add the Supabase callback URL shown under Authentication → Sign In / Providers → Google to the client's authorized redirect URIs.
2. Enable Google in the dedicated staging Supabase project. Enter the client ID and secret in the Google provider settings. Include the staging app's exact return URL, `https://usi-design-thinking-web-staging.vercel.app/learn`, under Authentication → URL Configuration. Use exact development and preview URLs when needed.
3. Set `NEXT_PUBLIC_GOOGLE_SIGN_IN=true` in the matching frontend environment and rebuild. The flag controls the button only. Supabase owns provider settings and verification. Keep the OAuth client secret out of repository files and browser variables.
4. Sign in with a dedicated Google test identity. Check its application role, refresh the page, and sign out.

[Supabase Google sign-in setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

## Loading behavior

The workspace requests liveness once on entry, with a per-tab cooldown. This gives the staging API a chance to start while someone is reading the page or entering credentials. A verified profile is shared across navigation for 15 seconds and reset on sign-out. Authorization remains on each API request. Independent course data loads in parallel. Workspace loading messages explain the delay and keep help available.

The existing staging API may sleep on the Free plan. Measure the first authenticated page after idle separately from warm requests. Changing the frontend reduces repeated work. Wake time depends on the host. The new dashboard can show recent course progress and authorized team milestones against the previous backend until its batch endpoints are deployed.

[Render Free service behavior](https://render.com/docs/free)
