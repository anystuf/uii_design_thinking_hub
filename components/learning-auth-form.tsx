"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AuthTimeoutError, withAuthDeadline } from "@/lib/auth-timeout";
import { authRedirectUrl } from "@/lib/auth-redirect";
import { ArrowRight, CheckCircle2, Mail, RefreshCcw } from "lucide-react";

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === "true";
const field = "mt-1.5 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950";

export function LearningAuthForm() {
  const [signUp, setSignUp] = useState(false);
  const [requestedRole, setRequestedRole] = useState<"STUDENT" | "LECTURER" | "MENTOR">("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState("");
  const [confirmationError, setConfirmationError] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resendPending, setResendPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const confirmInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!resendCooldown) return;
    const timer = window.setTimeout(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error") || new URLSearchParams(window.location.search).has("error")) {
      setError("Sign-in could not be completed. Try again or use email.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || timedOut) return;
    setError("");
    setMessage("");
    if (signUp && password !== confirmation) {
      setConfirmationError(true);
      confirmInput.current?.focus();
      return;
    }
    setConfirmationError(false);
    setPending("email");
    try {
      const auth = getSupabaseBrowserClient().auth;
      if (signUp) {
        const result = await withAuthDeadline(() => auth.signUp({
          email: email.trim(), password, options: {
            emailRedirectTo: authRedirectUrl(window.location.origin, window.location.pathname),
            // Metadata represents an interest/request, NEVER an authorization role.
            // The NestJS JwtAuthGuard always provisions STUDENT until a trusted
            // administrator approves a teaching or mentoring account.
            data: { requested_role: requestedRole },
          },
        }));
        if (result.error) throw result.error;
        if (!result.data.user && !result.data.session) throw new Error("The signup response could not be verified.");
        // Supabase can intentionally return an obfuscated user for an existing
        // address. Never claim an email was delivered based on a null session.
        // Instead show the next steps in a dedicated state.
        if (!result.data.session) {
          setConfirmationEmail(email.trim().toLowerCase());
          setResendCooldown(0);
        } else if (requestedRole !== "STUDENT") {
          setMessage("Signup successful. Your selected role is a request, not an assigned permission. Contact an administrator to verify your access.");
        }
        setPassword("");
        setConfirmation("");
      } else {
        const result = await withAuthDeadline(() => auth.signInWithPassword({ email: email.trim(), password }));
        if (result.error) throw result.error;
        if (!result.data.session) {
          setError("No sign-in session was returned. Confirm your email and sign in again.");
        }
      }
    } catch (err) {
      if (err instanceof AuthTimeoutError || (err instanceof Error && err.message.includes("Đăng nhập chưa được xác nhận"))) {
        setTimedOut(true);
        setError("Authentication has not responded. Reload and check your email if you just registered.");
      } else {
        const code = err && typeof err === "object" && "code" in err ? err.code : null;
        const status = err && typeof err === "object" && "status" in err ? err.status : null;
        setError(code === "invalid_credentials" ? "Incorrect email or password."
          : code === "email_not_confirmed" ? "Confirm your email address before signing in."
          : code === "weak_password" ? "Your password does not meet the requirements. Choose a stronger password."
          : status === 429 || code === "over_email_send_rate_limit" || code === "email_rate_limit_exceeded" || code === "over_request_rate_limit"
            ? "Too many email requests. Check your inbox and spam folder before trying again."
          : code === "user_already_exists" || code === "user_already_registered"
            ? "This email may already be registered. Try signing in."
          : "The request could not be completed. Check your details and try again.");
      }
    } finally { setPending(null); }
  }

  async function google() {
    if (pending || timedOut || !googleEnabled) return;
    setError("");
    setPending("google");
    try {
      const result = await withAuthDeadline(() => getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authRedirectUrl(window.location.origin, window.location.pathname) },
      }));
      if (result.error || !result.data.url) throw new Error("Google sign-in unavailable");
    } catch {
      setPending(null);
      setError("Google sign-in is unavailable. Try again or use email.");
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail || resendPending || resendCooldown > 0) return;
    setResendPending(true);setError("");setMessage("");
    try {
      const result = await withAuthDeadline(() => getSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: { emailRedirectTo: authRedirectUrl(window.location.origin, window.location.pathname) },
      }));
      if (result.error) throw result.error;
      setResendCooldown(60);
      setMessage("Resend requested. If your account needs confirmation, check your inbox, spam, and promotions folders.");
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : null;
      const status = err && typeof err === "object" && "status" in err ? err.status : null;
      setError(status === 429 || code === "over_email_send_rate_limit" || code === "email_rate_limit_exceeded"
        ? "Too many requests. Check your existing emails or try again later."
        : err instanceof AuthTimeoutError
          ? "No response to the resend request. Check your inbox before trying again."
          : "Could not resend the email. If already confirmed, sign in.");
    } finally { setResendPending(false); }
  }

  function goToLogin() {
    setConfirmationEmail(null);setSignUp(false);setPassword("");setConfirmation("");
    setError("");setMessage("");setConfirmationError(false);setVisible(false);
  }

  if (confirmationEmail) return (
    <section aria-labelledby="signup-next-title" className="mx-auto max-w-md rounded-2xl border border-[#cbded3] bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Mail size={28} aria-hidden="true"/></div>
      <h1 id="signup-next-title" className="text-2xl font-black tracking-tight text-[#173445] sm:text-3xl">Check your email to continue</h1>
      <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        <CheckCircle2 size={17} aria-hidden="true" className="mr-2 inline"/>
        Your signup request has been processed. If confirmation is required, a link will be sent to your email.
      </p>
      <p className="mt-4 break-all rounded-xl bg-[#f1f6f3] p-3 text-sm font-bold text-[#173445]">{confirmationEmail}</p>
      <ol className="mt-5 list-inside list-decimal space-y-3 text-sm leading-6 text-[#405e66]">
        <li>Open that email inbox; check spam and promotions too.</li>
        <li>If you receive a UII confirmation email, open its confirmation link.</li>
        <li>Return to UII and sign in. If you already confirmed, you can sign in now.</li>
      </ol>
      {requestedRole !== "STUDENT" && <p className="mt-4 rounded-xl bg-[#fff5e8] p-3 text-xs leading-6 text-[#72502e]">
        The {requestedRole === "LECTURER" ? "Lecturer" : "Mentor"} role is only a request. New accounts start as Student; an administrator must approve additional permissions.
      </p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
      <button type="button" onClick={goToLogin} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173762] px-4 text-sm font-bold text-white hover:bg-[#244e78]">
        I confirmed my email · Sign in <ArrowRight size={17}/>
      </button>
      <button type="button" disabled={resendPending || resendCooldown > 0} onClick={() => void resendConfirmation()}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbded3] px-4 text-sm font-semibold text-[#173445] disabled:cursor-not-allowed disabled:opacity-50">
        <RefreshCcw size={16}/>{resendPending ? "Requesting another email…" : resendCooldown ? "Resend available in " + resendCooldown + " seconds" : "Didn't receive it? Resend confirmation"}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-[#6c7c7e]">No need to register again. This page does not reveal anyone else's account status or password.</p>
    </section>
  );

  return (
    <section aria-labelledby="learning-auth-title" className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
      <h1 id="learning-auth-title" className="text-2xl font-semibold tracking-tight">{signUp ? "Create account" : "Sign in"}</h1>
      <p className="mt-2 text-sm text-slate-600">{signUp ? "Use an inbox you can access to confirm your account." : "Access your courses, progress, and projects."}</p>
      {googleEnabled && (
        <div className="mt-5">
          <button type="button" disabled={!!pending || timedOut} onClick={() => void google()}
            className="min-h-11 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
            {pending === "google" ? "Opening Google…" : "Continue with Google"}
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-600 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">Or use email</div>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-900">{message}</p>}
      <form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="auth-email" className="text-sm font-semibold">Email</label>
          <input id="auth-email" autoComplete="email" required type="email" value={email} onChange={event => setEmail(event.target.value)} className={field}/>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="auth-password" className="text-sm font-semibold">Password</label>
            <button type="button" onClick={() => setVisible(value => !value)} aria-controls={signUp ? "auth-password auth-confirmation" : "auth-password"} className="min-h-11 px-2 text-sm font-semibold text-[#153b77]">{visible ? "Hide password" : "Show password"}</button>
          </div>
          <input id="auth-password" autoComplete={signUp ? "new-password" : "current-password"} required minLength={signUp ? 8 : undefined}
            type={visible ? "text" : "password"} value={password} onChange={event => { setPassword(event.target.value); setConfirmationError(false); }}
            aria-describedby={signUp ? "auth-password-hint" : undefined} className={field}/>
          {signUp && <p id="auth-password-hint" className="mt-1 text-sm text-slate-600">Use at least 8 characters.</p>}
        </div>
        {signUp && <fieldset className="rounded-xl border border-[#d6e3dc] bg-[#f4f9f4] p-4">
          <legend className="px-1 text-sm font-bold text-[#173c43]">Which role would you like to request?</legend>
          <div className="mt-2 space-y-2">
            {([
              ["STUDENT", "Student", "Take part in courses and projects."],
              ["LECTURER", "Lecturer", "Request permission to create courses and review submissions."],
              ["MENTOR", "Mentor", "Request permission to mentor projects."],
            ] as const).map(([value, label, detail]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <input className="mt-1 size-4 accent-[#164767]" type="radio" name="requested-role" value={value}
                  checked={requestedRole === value} onChange={() => setRequestedRole(value)}/>
                <span><strong className="block">{label}</strong><span className="mt-0.5 block text-xs leading-5 text-slate-600">{detail}</span></span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-6 text-[#47606a]">This is a <strong>requested role</strong>, not an assigned permission. Every new account starts as a Student. An administrator must verify and grant Lecturer, Mentor, or Administrator access.</p>
        </fieldset>}
        {signUp && <div>
          <label htmlFor="auth-confirmation" className="text-sm font-semibold">Confirm password</label>
          <input ref={confirmInput} id="auth-confirmation" required autoComplete="new-password" type={visible ? "text" : "password"} value={confirmation}
            aria-invalid={confirmationError || undefined} aria-describedby={confirmationError ? "auth-confirmation-error" : undefined}
            onChange={event => { setConfirmation(event.target.value); setConfirmationError(false); }} className={field}/>
          {confirmationError && <p id="auth-confirmation-error" role="alert" className="mt-1 text-sm text-red-800">Passwords do not match.</p>}
        </div>}
        <button disabled={!!pending || timedOut} className="min-h-11 w-full rounded-md bg-[#173762] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending === "email" ? "Authenticating…" : signUp ? "Create account" : "Sign in"}
        </button>
        {timedOut && <button type="button" onClick={() => window.location.reload()} className="min-h-11 w-full rounded-md border px-4 py-2 text-sm font-semibold">Reload page</button>}
      </form>
      {!signUp && <Link href="/forgot-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#153b77] underline">Forgot password?</Link>}
      <button type="button" disabled={!!pending || timedOut} className="mt-2 min-h-11 text-left text-sm font-semibold text-[#153b77] underline" onClick={() => {
        setSignUp(value => !value); setPassword(""); setConfirmation(""); setError(""); setMessage(""); setConfirmationError(false); setVisible(false);
      }}>{signUp ? "Already have an account? Sign in" : "New here? Create an account"}</button>
    </section>
  );
}
