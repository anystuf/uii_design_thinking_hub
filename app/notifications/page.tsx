'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowLeft, Bell, CheckCircle2, LoaderCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi } from '@/lib/authenticated-api';
import { withAuthDeadline } from '@/lib/auth-timeout';

type Notice = {
  id: string; type: string; entityType: string; entityId: string;
  message: string; readAt?: string | null; createdAt: string;
};
const button = 'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#153b77] disabled:opacity-50';

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return authenticatedApi<T>(path, token, init);
}

export default function NotificationsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const token = session?.access_token ?? '';

  useEffect(() => {
    let active = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void withAuthDeadline(() => auth.getSession())
        .then(({ data, error: authError }) => {
          if (active) { setSession(data.session); setReady(true); if (authError) setError(authError.message); }
        })
        .catch((err: unknown) => { if (active) { setReady(true); setError(err instanceof Error ? err.message : 'Không đọc được phiên đăng nhập.'); } });
      const { data: { subscription } } = auth.onAuthStateChange((_event, next) => { if (active) setSession(next); });
      return () => { active = false; subscription.unsubscribe(); };
    } catch (err) {
      setReady(true); setError(err instanceof Error ? err.message : 'Auth configuration missing.');
    }
  }, []);

  useEffect(() => {
    if (!token) { setNotices([]); setBusy(false); return; }
    let active = true;
    setBusy(true);
    void api<Notice[]>(token, '/notifications')
      .then((list) => { if (active) { setNotices(list); setError(''); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Request failed.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [token, reload]);

  async function markRead(id: string) {
    setBusy(true); setError('');
    try {
      await api(token, '/notifications/' + id + '/read', { method: 'PATCH' });
      setNotices((list) => list.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark notification as read.');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[#153b77] p-3 text-white"><Bell size={23}/></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-[#f37021]">UII Design Thinking Hub</p>
              <h1 className="text-xl font-extrabold">Notification Center</h1></div></div>
          <Link href="/studio" className="flex items-center gap-1 text-sm font-semibold text-[#153b77]"><ArrowLeft size={16}/> Studio</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 px-5 py-8">
        <p className="text-sm text-slate-500">Release D · In-app thông báo deadline và feedback. Mỗi người chỉ xem được thông báo của mình.</p>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button disabled={busy} onClick={() => ready && session ? setReload((n) => n + 1) : window.location.reload()} className={button + ' ml-3'}>Thử lại</button></div>}
        {busy && <p className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={15}/> Đang xử lý…</p>}
        {ready && !session && <div className="rounded-xl bg-white p-5">Bạn cần <Link className="font-bold underline" href="/learn">đăng nhập</Link>.</div>}
        {session && (
          <section className="space-y-3">
            {notices.map((notice) => (
              <div key={notice.id} className={'flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ' + (!notice.readAt ? 'border-[#e5af78]' : 'border-slate-200')}>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#f37021]">{notice.type.replaceAll('_',' ')}</p>
                  <p className="text-sm font-semibold">{notice.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(notice.createdAt).toLocaleString('vi-VN')}</p>
                  <Link href={notice.entityType === 'SubmissionSnapshot' ? '/evidence' : '/studio'}
                    className="mt-3 inline-block text-sm font-bold text-[#153b77] underline">
                    {notice.entityType === 'SubmissionSnapshot' ? 'Xem bài nộp / feedback' : 'Xem challenge'}
                  </Link>
                </div>
                {!notice.readAt ?
                  <button className={button} disabled={busy} onClick={() => void markRead(notice.id)}><CheckCircle2 size={14} className="mr-1 inline"/> Đã đọc</button>
                  : <span className="text-xs text-green-700">Đã đọc</span>}
              </div>
            ))}
            {!notices.length && !busy && !error && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Chưa có thông báo mới.</div>}
          </section>
        )}
      </main>
    </div>
  );
}
