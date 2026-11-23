'use client';

import Link from 'next/link';
import { WorkspaceLoading } from '@/components/workspace-loading';
import type { WorkspaceRole } from '@/components/workspace-guide';
import { WorkspaceNav } from '@/components/workspace-nav';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CheckCircle2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi, workspaceProfile } from '@/lib/authenticated-api';
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
  const [account, setAccount] = useState<{token: string; role: WorkspaceRole} | null>(null);
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
    void workspaceProfile<{role: WorkspaceRole}>(token, reload > 0)
      .then(user => { if (active) setAccount({token, role: user.role}); })
      .catch(() => {});
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
    <div className="uii-workspace min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <WorkspaceNav title="Thông báo" role={account?.token === token ? account.role : undefined} guest={ready && !session} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-5 px-5 py-8">
        <header className="rounded-[28px] border border-[#cce5d7] bg-[#d4f0dd] p-6 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#78513b]">YOUR NEXT STEP</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-.045em]">Thông báo và phản hồi.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#48606b]">Nắm những cập nhật quan trọng để tiếp tục học, thực hành và cải tiến.</p>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Theo dõi hạn nộp và phản hồi dành cho bạn.</p>
          {(account?.role === 'ADMIN' || account?.role === 'LECTURER') && <Link href="/console" className="inline-flex min-h-11 items-center rounded-xl bg-[#173445] px-4 text-sm font-bold text-white">Soạn thông báo trong Console</Link>}
        </div>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button disabled={busy} onClick={() => ready && session ? setReload((n) => n + 1) : window.location.reload()} className={button + ' ml-3'}>Thử lại</button></div>}
        {!ready ? <WorkspaceLoading label="Đang kiểm tra phiên đăng nhập…"/> : busy && <WorkspaceLoading label="Đang tải thông báo…"/>}
        {ready && !session && <div className="rounded-xl bg-white p-5">Bạn cần <Link className="font-bold underline" href="/learn">đăng nhập</Link>.</div>}
        {session && (
          <section className="space-y-3">
            {notices.map((notice) => (
              <div key={notice.id} className={'flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm ' + (!notice.readAt ? 'border-[#e5af78]' : 'border-slate-200')}>
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#ad4007]">{notice.type.replaceAll('_',' ')}</p>
                  <p className="whitespace-pre-wrap break-words text-sm font-semibold">{notice.message}</p>
                  <p className="mt-2 text-xs text-slate-600">{new Date(notice.createdAt).toLocaleString('vi-VN')}</p>
                  <Link href={notice.entityType === 'SubmissionSnapshot' ? '/evidence' : notice.entityType === 'Course' ? '/learn?course='+encodeURIComponent(notice.entityId) : notice.entityType === 'Platform' ? '/dashboard' : '/studio'}
                    className="mt-3 inline-block text-sm font-bold text-[#153b77] underline">
                    {notice.entityType === 'SubmissionSnapshot' ? 'Xem bài nộp và phản hồi' : notice.entityType === 'Course' ? 'Mở khóa học' : notice.entityType === 'Platform' ? 'Mở tổng quan' : 'Xem thử thách'}
                  </Link>
                </div>
                {!notice.readAt ?
                  <button className={button} disabled={busy} onClick={() => void markRead(notice.id)}><CheckCircle2 size={14} className="mr-1 inline"/> Đã đọc</button>
                  : <span className="text-xs text-green-700">Đã đọc</span>}
              </div>
            ))}
            {!notices.length && !busy && !error && <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-600">Chưa có thông báo mới.</div>}
          </section>
        )}
      </main>
    </div>
  );
}
