'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

import { passwordRecoveryRedirectUrl } from '@/lib/auth-redirect';
import { AuthTimeoutError, withAuthDeadline } from '@/lib/auth-timeout';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

/** Request only; responses never disclose whether an email belongs to an account. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get('reason') === 'expired');
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const redirectTo = passwordRecoveryRedirectUrl(window.location.origin);
      const result = await withAuthDeadline(() =>
        getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), { redirectTo })
      );
      if (result.error) throw result.error;
      setSubmitted(true);
    } catch (err) {
      const status = err && typeof err === 'object' && 'status' in err ? err.status : null;
      if (status === 429) {
        setError('Too many requests. Check your inbox and try again later.');
      } else if (err instanceof AuthTimeoutError) {
        setError('The authentication service has not responded. Check your inbox before retrying.');
      } else {
        setError('The request could not be completed. Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-12 text-[#173445]">
      <section className="w-full max-w-md rounded-2xl border border-[#cbded3] bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          <Mail size={28} aria-hidden="true"/>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-800">UII Design Thinking Hub</p>
        <h1 className="mt-3 text-2xl font-black">{submitted ? 'Check your email' : 'Reset password'}</h1>
        {expired && !submitted && (
          <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            The previous recovery link has expired or has already been used. Request a fresh email below, then open only the newest link. If the problem repeats immediately, the email provider may be scanning links before you click them.
          </p>
        )}
        {submitted ? (
          <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            If this email belongs to a UII account, password-reset instructions will be sent to it.
            Check your spam folder. Use only the newest recovery email, and do not reopen the same one-time link.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6">Enter your UII account email to receive reset instructions.</p>
            <form className="mt-5 space-y-4" onSubmit={(event) => void requestReset(event)}>
              <div>
                <label htmlFor="recovery-email" className="text-sm font-semibold">Email</label>
                <input id="recovery-email" autoComplete="email" type="email" required value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base"/>
              </div>
              {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <button type="submit" disabled={busy}
                className="min-h-11 w-full rounded-md bg-[#173762] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {busy ? 'Sending…' : 'Send reset instructions'}
              </button>
            </form>
          </>
        )}
        <Link href="/learn" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#153b77] underline">
          <ArrowLeft size={16} aria-hidden="true"/> Back to sign in
        </Link>
      </section>
    </main>
  );
}
