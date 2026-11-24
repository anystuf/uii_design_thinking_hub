'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

import { AuthTimeoutError, withAuthDeadline } from '@/lib/auth-timeout';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type RecoveryState = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * This route receives a Supabase password-recovery redirect.
 * The Supabase browser SDK verifies the URL fragment and establishes a session;
 * a query-string flag alone is never treated as authorization.
 */
export default function ResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryEvent = false;
    // Supabase may consume the fragment during client initialization.
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const recoveryFragment = fragment.get('type') === 'recovery' && !!fragment.get('access_token') && !!fragment.get('refresh_token');
    try {
      const client = getSupabaseBrowserClient();
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === 'PASSWORD_RECOVERY') {
          recoveryEvent = true;
          if (session) setState('ready');
        }
        // Do not override a completed password change when the client signs out.
      });

      void withAuthDeadline(() => client.auth.getSession()).then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) { setState('invalid'); return; }
        if (data.session && (recoveryEvent || recoveryFragment)) setState('ready');
        else if (!recoveryEvent) setState('invalid');
      }).catch(() => { if (active && !recoveryEvent) setState('invalid'); });

      return () => { active = false; subscription.unsubscribe(); };
    } catch {
      setState('invalid');
    }
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || state !== 'ready') return;
    setError('');
    if (password.length < 8) {
      setError('Mật khẩu mới cần ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirmation) {
      setError('Hai mật khẩu chưa khớp.');
      return;
    }
    setPending(true);
    try {
      const client = getSupabaseBrowserClient();
      const result = await withAuthDeadline(() => client.auth.updateUser({ password }));
      if (result.error) throw result.error;
      setPassword('');
      setConfirmation('');
      // The update has succeeded. Best-effort local sign-out should not turn a
      // successful password change into a false failure if the network stalls.
      try { await client.auth.signOut({ scope: 'local' }); } catch { /* best effort */ }
      setState('done');
    } catch (err) {
      if (err instanceof AuthTimeoutError) {
        setError('Chưa nhận được kết quả. Hãy kiểm tra lại phiên đăng nhập trước khi thử lại.');
      } else {
        setError('Chưa thể cập nhật mật khẩu. Liên kết có thể đã hết hạn; hãy yêu cầu email mới.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-12 text-[#173445]">
      <section className="w-full max-w-md rounded-2xl border border-[#cbded3] bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
          {state === 'done' ? <CheckCircle2 size={28} aria-hidden="true"/> : <KeyRound size={28} aria-hidden="true"/>}
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-800">UII Design Thinking Hub</p>
        {state === 'checking' && (
          <>
            <h1 className="mt-3 text-2xl font-black">Đang kiểm tra liên kết…</h1>
            <p role="status" className="mt-3 text-sm leading-6">Hệ thống đang xác minh phiên khôi phục mật khẩu.</p>
          </>
        )}
        {state === 'invalid' && (
          <>
            <h1 className="mt-3 text-2xl font-black">Liên kết không còn hợp lệ</h1>
            <p role="alert" className="mt-3 text-sm leading-6">Hãy quay lại trang đăng nhập và chọn Quên mật khẩu để yêu cầu liên kết mới.</p>
            <Link href="/learn" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173762] px-5 py-2.5 text-sm font-bold text-white">
              Về trang đăng nhập <ArrowRight size={17} aria-hidden="true"/>
            </Link>
          </>
        )}
        {state === 'ready' && (
          <>
            <h1 className="mt-3 text-2xl font-black">Đặt mật khẩu mới</h1>
            <p className="mt-2 text-sm leading-6">Chọn mật khẩu mạnh và chỉ sử dụng liên kết khôi phục dành cho bạn.</p>
            <form onSubmit={(event) => void updatePassword(event)} className="mt-5 space-y-4">
              <div>
                <label htmlFor="new-password" className="text-sm font-semibold">Mật khẩu mới</label>
                <input id="new-password" type="password" autoComplete="new-password" minLength={8} required
                  value={password} onChange={event => setPassword(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base"/>
              </div>
              <div>
                <label htmlFor="new-password-confirm" className="text-sm font-semibold">Xác nhận mật khẩu mới</label>
                <input id="new-password-confirm" type="password" autoComplete="new-password" minLength={8} required
                  value={confirmation} onChange={event => setConfirmation(event.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-base"/>
              </div>
              {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <button type="submit" disabled={pending}
                className="min-h-11 w-full rounded-md bg-[#173762] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {pending ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </>
        )}
        {state === 'done' && (
          <>
            <h1 className="mt-3 text-2xl font-black">Đã cập nhật mật khẩu</h1>
            <p role="status" className="mt-3 text-sm leading-6">Bạn có thể đăng nhập UII bằng mật khẩu mới.</p>
            <Link href="/learn" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173762] px-5 py-2.5 text-sm font-bold text-white">
              Đăng nhập <ArrowRight size={17} aria-hidden="true"/>
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
