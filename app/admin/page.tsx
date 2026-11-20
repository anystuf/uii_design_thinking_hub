'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceNav } from '@/components/workspace-nav';
import { authenticatedApi } from '@/lib/authenticated-api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { withAuthDeadline } from '@/lib/auth-timeout';

type User = { id: string; fullName: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR' };

export default function AdminPage() {
  const [account, setAccount] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(''); setAccount(null); setUsers([]);
      try {
        const auth = getSupabaseBrowserClient().auth;
        const result = await withAuthDeadline(() => auth.getSession());
        if (result.error) throw result.error;
        if (!result.data.session) return;
        const token = result.data.session.access_token;
        const me = await authenticatedApi<User>('/auth/me', token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setAccount(me);
        if (me.role === 'ADMIN') {
          const list = await authenticatedApi<User[]>('/users', token, { signal: controller.signal });
          if (!controller.signal.aborted) setUsers(list);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không tải được tài khoản.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    try {
      const { data: { subscription } } = getSupabaseBrowserClient().auth.onAuthStateChange((event) => {
        if (event !== 'INITIAL_SESSION') {
          setAccount(null); setUsers([]); setReload((value) => value + 1);
        }
      });
      return () => subscription.unsubscribe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được phiên đăng nhập.');
    }
  }, []);

  return <div className="uii-workspace min-h-screen bg-[#f6f8fc]">
    <WorkspaceNav title="Quản trị" role={account?.role} />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-5 py-8">
      {loading && <p role="status">Đang kiểm tra quyền quản trị…</p>}
      <header className="rounded-[28px] border border-[#e3d8ec] bg-[#e7e2fb] p-6 sm:p-9">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#7a3a47]">UII · PEOPLE & GOVERNANCE</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-.045em]">Quản trị và phát triển cộng đồng.</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#48606b]">Quản lý tài khoản, điều phối khóa học và theo dõi hoạt động đổi mới. Vai trò và quyền truy cập được xác minh bởi máy chủ.</p>
        </header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}<button className="ml-3 min-h-11 underline" onClick={() => setReload((value) => value + 1)}>Thử lại</button></div>}
      {!loading && !account && !error && <p>Đăng nhập để tiếp tục. <Link href="/learn" className="underline">Đăng nhập</Link></p>}
      {account && account.role !== 'ADMIN' && <p role="alert">Trang này dành cho quản trị viên. <Link href="/dashboard" className="underline">Về tổng quan</Link></p>}
      {account?.role === 'ADMIN' && !loading && !error && <>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-2xl font-bold">Tài khoản trên nền tảng</h2>
          <p className="mt-2 text-slate-600">{users.length} tài khoản</p>
          <ul className="mt-5 divide-y">{users.map((user) => <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-4"><span className="font-semibold">{user.fullName}</span><span className="rounded-lg bg-blue-50 px-3 py-2 text-sm">{user.role}</span></li>)}</ul>
          {!users.length && <p className="mt-4">Chưa có tài khoản để hiển thị.</p>}
        </section>
        <div className="flex flex-wrap gap-4"><Link className="rounded-xl border bg-white p-4 font-semibold" href="/learn">Quản lý khóa học</Link><Link className="rounded-xl border bg-white p-4 font-semibold" href="/review">Xem bài nộp & đánh giá</Link></div>
      </>}
    </main>
  </div>;
}
