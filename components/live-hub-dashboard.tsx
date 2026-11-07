'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, BookOpen, CheckCircle2, ChevronRight,
  ClipboardCheck, Compass, FileCheck2, FileText, FolderKanban, GraduationCap,
  Layers3, Lightbulb, LockKeyhole, LogOut, Menu, RefreshCw, RotateCcw, ShieldCheck,
  Sparkles, Target, Users, X, Zap,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type Role = 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR';
type Account = { id: string; fullName: string; email: string; role: Role };
type Course = {
  id: string; title: string; description?: string | null; level?: string | null;
  status: string; createdById?: string; _count?: { lessons?: number; enrollments?: number };
};
type Enrollment = { id: string; courseId: string; course: Course };
type Project = {
  id: string; title: string; status: string; currentStage: string;
  course?: { title: string }; _count?: { evidence?: number; feedback?: number };
};
type Notification = { id: string; message: string; readAt: string | null; createdAt: string };
type Submission = { id: string; project: { title: string } };
type Progress = { totalLessons: number; completedLessons: number; percent: number };
type DashboardData = {
  courses: Course[] | null; projects: Project[] | null; notifications: Notification[] | null;
  enrollments: Enrollment[] | null; queue: Submission[] | null; progress: Progress | null;
};
const emptyData: DashboardData = {
  courses: null, projects: null, notifications: null, enrollments: null, queue: null, progress: null,
};
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function api<T>(path: string, token: string): Promise<T> {
  const response = await fetch(API_URL + path, {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error('HTTP ' + response.status + ' — ' + body.slice(0, 160));
  }
  return response.json() as Promise<T>;
}
function valueOf<T>(item: PromiseSettledResult<T>): T | null {
  return item.status === 'fulfilled' ? item.value : null;
}
function roleName(role: Role) {
  return { STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị viên', MENTOR: 'Mentor' }[role];
}
function stageName(stage: string) {
  return ({ EMPATHIZE: 'Empathize', DEFINE: 'Define', IDEATE: 'Ideate', PROTOTYPE: 'Prototype', TEST: 'Test' } as Record<string, string>)[stage] ?? stage;
}
const modes = [
  { title: 'Empathize', subtitle: 'Thấu hiểu con người', icon: Users, tint: 'bg-blue-50 text-blue-700' },
  { title: 'Define', subtitle: 'Xác định vấn đề', icon: Target, tint: 'bg-violet-50 text-violet-700' },
  { title: 'Ideate', subtitle: 'Mở rộng ý tưởng', icon: Lightbulb, tint: 'bg-amber-50 text-amber-700' },
  { title: 'Prototype', subtitle: 'Hiện thực hóa', icon: Layers3, tint: 'bg-emerald-50 text-emerald-700' },
  { title: 'Test', subtitle: 'Kiểm chứng', icon: Activity, tint: 'bg-rose-50 text-rose-700' },
] as const;
const hubLinks = [
  { label: 'Tổng quan', href: '/dashboard', icon: Compass, desc: 'Hành trình của bạn' },
  { label: 'Learning Foundation', href: '/learn', icon: BookOpen, desc: 'Khóa học và tiến độ' },
  { label: 'Design Studio', href: '/studio', icon: Layers3, desc: 'Challenge và team' },
  { label: 'Evidence & Iteration', href: '/evidence', icon: FileCheck2, desc: 'Minh chứng và bài nộp' },
  { label: 'Thông báo', href: '/notifications', icon: Bell, desc: 'Phản hồi và hạn nộp' },
] as const;

function MiniLogo() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f37021] text-sm font-black tracking-tighter text-white shadow-lg shadow-orange-500/20">UII</span>
  );
}
function NavItem({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: typeof BookOpen; active?: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
      className={'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition ' +
        (active ? 'bg-white/15 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
      <Icon size={18} className={active ? 'text-[#ffae74]' : 'text-slate-400 group-hover:text-[#ffae74]'} aria-hidden="true" />
      <span>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f37021]" />}
    </Link>
  );
}
function Metric({ label, value, detail, icon: Icon, tone }: {
  label: string; value: number | string | null; detail: string; icon: typeof BookOpen; tone: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200/75 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.035)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-slate-500">{label}</p>
        <span className={'inline-flex h-9 w-9 items-center justify-center rounded-xl ' + tone}><Icon size={17}/></span>
      </div>
      <p className="mt-3 font-[family-name:var(--font-sans-ui)] text-3xl font-extrabold tracking-tight text-[#0a2044]">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
function ModuleCard({ href, title, eyebrow, text, icon: Icon, color, index }: {
  href: string; title: string; eyebrow: string; text: string; icon: typeof BookOpen; color: string; index: string;
}) {
  return (
    <Link href={href} className="group relative flex min-h-[186px] flex-col justify-between overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.035)] transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_14px_36px_rgba(20,42,78,0.11)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">
      <span className="absolute -right-1 -top-6 font-[family-name:var(--font-sans-ui)] text-[105px] font-black leading-none text-slate-50 transition group-hover:text-orange-50/80" aria-hidden="true">{index}</span>
      <div className="relative flex items-start justify-between">
        <span className={'inline-flex h-11 w-11 items-center justify-center rounded-2xl ' + color}><Icon size={21}/></span>
        <ArrowUpRight className="text-slate-400 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#f37021]" size={19}/>
      </div>
      <div className="relative mt-5">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#e4661d]">{eyebrow}</p>
        <h3 className="text-base font-extrabold text-[#0a2044]">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </Link>
  );
}

export function LiveHubDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partialError, setPartialError] = useState('');
  const [reload, setReload] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    try {
      const client = getSupabaseBrowserClient();
      void client.auth.getSession().then(({ data: result, error: authError }) => {
        if (!alive) return;
        if (authError) setError(authError.message);
        setSession(result.session);
        setAuthReady(true);
      }).catch((err: unknown) => {
        if (alive) { setError(err instanceof Error ? err.message : 'Không đọc được phiên đăng nhập.'); setAuthReady(true); }
      });
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
        if (alive) setSession(next);
      });
      return () => { alive = false; subscription.unsubscribe(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cấu hình xác thực chưa sẵn sàng.');
      setAuthReady(true);
    }
  }, []);

  const loadDashboard = useCallback(async (token: string, alive: () => boolean) => {
    setLoading(true);
    setError('');
    setPartialError('');
    try {
      // Roles come from the trusted API; no client-selectable role switch.
      const me = await api<Account>('/auth/me', token);
      if (!alive()) return;
      setAccount(me);
      const reviewer = me.role === 'ADMIN' || me.role === 'LECTURER';
      const [coursesResult, projectsResult, notificationsResult, enrollmentsResult, queueResult] = await Promise.allSettled([
        api<Course[]>('/courses', token),
        api<Project[]>('/projects', token),
        api<Notification[]>('/notifications', token),
        me.role === 'STUDENT' ? api<Enrollment[]>('/courses/my-enrollments', token) : Promise.resolve(null),
        reviewer ? api<Submission[]>('/assessments/queue', token) : Promise.resolve(null),
      ]);
      if (!alive()) return;
      const courses = valueOf(coursesResult), projects = valueOf(projectsResult);
      const notifications = valueOf(notificationsResult);
      const enrollments = valueOf(enrollmentsResult), queue = valueOf(queueResult);
      const failed = [coursesResult, projectsResult, notificationsResult, enrollmentsResult, queueResult]
        .filter((result) => result.status === 'rejected').length;
      setData({ courses, projects, notifications, enrollments, queue, progress: null });
      if (failed) setPartialError('Không thể tải ' + failed + ' nguồn dữ liệu. Một số chỉ số chưa sẵn sàng; hãy thử tải lại.');
      const activeCourse = enrollments?.[0];
      if (me.role === 'STUDENT' && activeCourse) {
        try {
          const progress = await api<Progress>('/courses/' + encodeURIComponent(activeCourse.courseId) + '/my-progress', token);
          if (alive()) setData((previous) => ({ ...previous, progress }));
        } catch {
          if (alive()) setPartialError('Chưa tải được toàn bộ dữ liệu tiến độ. Hãy thử tải lại.');
        }
      }
    } catch (err) {
      if (alive()) { setAccount(null); setData(emptyData); setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ.'); }
    } finally {
      if (alive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) {
      setAccount(null);
      setData(emptyData);
      setPartialError('');
      return;
    }
    let alive = true;
    void loadDashboard(token, () => alive);
    return () => { alive = false; };
  }, [session?.access_token, reload, loadDashboard]);

  async function signOut() {
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signOut();
      if (authError) throw authError;
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng xuất được.');
    }
  }

  const reviewer = account?.role === 'ADMIN' || account?.role === 'LECTURER';
  const student = account?.role === 'STUDENT';
  const firstName = account?.fullName?.trim().split(/\s+/).slice(-1)[0] || 'bạn';
  const unread = data.notifications?.filter((note) => !note.readAt).length ?? null;
  const pending = data.queue?.length ?? null;
  const nextCourse = data.enrollments?.[0]?.course ?? null;
  const topProject = data.projects?.[0] ?? null;
  const navItems = [...hubLinks, ...(reviewer ? [{ label: 'Assessment Studio', href: '/review', icon: ClipboardCheck, desc: 'Rubric và đánh giá' }] : [])];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#10284a]">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="sticky top-0 hidden h-screen w-[266px] shrink-0 flex-col bg-[#071d43] px-5 py-6 text-white lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-1" aria-label="UII Design Thinking Hub — Home">
            <MiniLogo/>
            <span className="leading-tight"><span className="block text-sm font-extrabold tracking-tight">Design Thinking</span><span className="block text-sm font-extrabold tracking-tight text-white/85">Hub</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">UII · Learning Experience</span></span>
          </Link>
          <div className="mt-9 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ffd2b3]"><span className="h-2 w-2 rounded-full bg-emerald-400"/> MVP STAGING</div>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">Dữ liệu thực · Kết nối an toàn</p>
          </div>
          <p className="mb-3 mt-9 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Không gian làm việc</p>
          <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
            {navItems.map((item) => <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={item.href === '/dashboard'}/>)}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <Sparkles size={20} className="text-[#ffa76b]"/>
              <p className="mt-3 text-sm font-extrabold">Tiến bộ qua từng vòng lặp</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Học, thử nghiệm, nhận phản hồi và cải tiến dựa trên minh chứng.</p>
            </div>
            {account && <button onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"><LogOut size={17}/> Đăng xuất</button>}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[78px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-xl sm:px-8 xl:px-10">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} className="rounded-xl border border-slate-200 p-2 lg:hidden">{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
              <div className="lg:hidden"><MiniLogo/></div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">UII / WORKSPACE</p>
                <p className="text-sm font-extrabold text-[#0a2044]">Tổng quan học tập</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {account && <Link href="/notifications" aria-label="Thông báo" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:border-[#f37021]"><Bell size={18}/>{unread !== null && unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f37021] px-1 text-[9px] font-extrabold text-white">{unread > 9 ? '9+' : unread}</span>}</Link>}
              {account ? <div className="flex items-center gap-3 rounded-xl bg-slate-50 py-1.5 pl-2 pr-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a2856] text-xs font-extrabold text-white">{account.fullName.trim().slice(0, 1).toUpperCase() || 'U'}</span>
                <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-extrabold">{account.fullName}</span><span className="block text-[10px] text-slate-500">{roleName(account.role)}</span></span>
              </div> : <Link href="/learn" className="rounded-xl bg-[#0a2856] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#143c76]">Đăng nhập <ArrowRight size={14} className="ml-1 inline"/></Link>}
            </div>
          </header>

          {menuOpen && <nav aria-label="Điều hướng trên thiết bị di động" className="fixed inset-x-0 top-[78px] z-30 flex max-h-[75vh] flex-col gap-1 overflow-y-auto border-b border-slate-200 bg-[#071d43] p-4 shadow-xl lg:hidden">
            {navItems.map((item) => <span key={item.href} onClick={() => setMenuOpen(false)}><NavItem href={item.href} label={item.label} icon={item.icon} active={item.href === '/dashboard'}/></span>)}
            {account && <button onClick={() => { setMenuOpen(false); void signOut(); }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white"><LogOut size={18}/> Đăng xuất</button>}
          </nav>}

          <main className="mx-auto max-w-[1380px] space-y-8 px-5 pb-16 pt-8 sm:px-8 xl:px-10">
            {!authReady ? <div role="status" className="rounded-[28px] border border-slate-200 bg-white p-12 text-center text-slate-600"><RefreshCw className="mx-auto mb-4 animate-spin text-[#f37021]" size={26}/>Đang xác thực phiên đăng nhập…</div> : null}
            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button disabled={loading} onClick={() => setReload((n) => n + 1)} className="inline-flex items-center gap-2 font-bold underline"><RefreshCw size={15}/> Thử lại</button></div>}
            {partialError && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><span>{partialError}</span><button disabled={loading} onClick={() => setReload((n) => n + 1)} className="inline-flex items-center gap-2 font-bold underline"><RefreshCw size={15}/> Tải lại</button></div>}

            {authReady && !session && (
              <section className="rounded-[28px] border border-slate-200 bg-white px-7 py-16 text-center shadow-[0_8px_40px_rgba(20,42,78,0.06)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#ef7229]"><LockKeyhole size={28}/></div>
                <p className="mt-6 text-xs font-black uppercase tracking-widest text-[#e4661d]">Learning Workspace</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0a2044]">Đăng nhập để tiếp tục hành trình</h1>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">Dashboard sử dụng tài khoản thực, dữ liệu tiến độ và phân quyền từ máy chủ. Hãy đăng nhập hoặc tạo tài khoản để xem không gian học tập của bạn.</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link href="/learn" className="inline-flex items-center gap-2 rounded-xl bg-[#f37021] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff843a]">Đăng nhập / Đăng ký <ArrowRight size={17}/></Link>
                  <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-[#102f61] transition hover:bg-slate-50">Về trang chủ</Link>
                </div>
              </section>
            )}

            {session && !account && !error && (
              <div role="status" className="rounded-[26px] border border-slate-200 bg-white p-10 text-center text-slate-600"><RefreshCw className="mx-auto mb-3 animate-spin text-[#f37021]" size={25}/>Đang tải dữ liệu học tập từ máy chủ…</div>
            )}

            {session && account && (
              <>
                <section className="relative overflow-hidden rounded-[30px] bg-[#071d43] p-7 text-white shadow-[0_20px_70px_rgba(7,29,67,0.14)] sm:p-9">
                  <div className="pointer-events-none absolute -right-14 -top-24 h-96 w-96 rounded-full border-[50px] border-[#f37021]/20" aria-hidden="true"/>
                  <div className="pointer-events-none absolute right-20 top-10 h-44 w-44 rounded-full bg-[#f37021]/10 blur-3xl" aria-hidden="true"/>
                  <div className="relative flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-2xl">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#ffd1aa]/20 bg-[#f37021]/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ffbe90]"><Sparkles size={14}/> {roleName(account.role)} · Live workspace</span>
                      <h1 className="mt-5 font-[family-name:var(--font-sans-ui)] text-3xl font-extrabold leading-tight tracking-tight sm:text-[40px]">Chào {firstName}, <span className="text-[#ff9b59]">tiếp tục tạo khác biệt.</span></h1>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{reviewer ? 'Quản lý hoạt động học tập, đồng hành cùng các nhóm và đưa ra phản hồi có giá trị.' : student ? 'Mỗi thử nghiệm và minh chứng đều đưa bạn đến gần hơn với một giải pháp hữu ích.' : 'Khám phá kiến thức và đóng góp vào những dự án đổi mới sáng tạo.'}</p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <Link href={reviewer ? '/review' : '/studio'} className="inline-flex items-center gap-2 rounded-xl bg-[#f37021] px-5 py-3 text-sm font-extrabold transition hover:bg-[#ff843a]">{reviewer ? 'Mở Assessment Studio' : 'Tiếp tục Design Studio'} <ArrowRight size={17}/></Link>
                        <Link href="/learn" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/20"><BookOpen size={17}/> Learning Foundation</Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                      <ShieldCheck className="text-emerald-300" size={22}/>
                      <span><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Quyền truy cập</span><span className="block text-sm font-extrabold">{roleName(account.role)}</span></span>
                    </div>
                  </div>
                </section>

                <section aria-labelledby="overview-title">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#e4661d]">YOUR WORKSPACE</p><h2 id="overview-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[#0a2044]">Tổng quan hôm nay</h2></div>
                    <button onClick={() => setReload((n) => n + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-600 transition hover:border-orange-300 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Làm mới</button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric label={student ? 'Khóa học đã tham gia' : 'Khóa học hiển thị'} value={student ? data.enrollments?.length ?? null : data.courses?.length ?? null} detail="Dữ liệu từ hệ thống" icon={BookOpen} tone="bg-blue-50 text-blue-700"/>
                    <Metric label={reviewer ? 'Dự án thuộc phạm vi' : 'Dự án của tôi'} value={data.projects?.length ?? null} detail="Dự án có quyền truy cập" icon={FolderKanban} tone="bg-violet-50 text-violet-700"/>
                    <Metric label={reviewer ? 'Bài chờ đánh giá' : 'Thông báo chưa đọc'} value={reviewer ? pending : unread} detail={reviewer ? 'Submission cần phản hồi' : 'Phản hồi và nhắc hạn'} icon={reviewer ? ClipboardCheck : Bell} tone="bg-orange-50 text-orange-700"/>
                    <Metric label={student ? 'Tiến độ khóa gần nhất' : 'Thông báo chưa đọc'} value={student ? data.progress ? data.progress.percent + '%' : null : unread} detail={student ? data.progress ? data.progress.completedLessons + '/' + data.progress.totalLessons + ' bài hoàn thành' : 'Đăng ký khóa học để theo dõi' : 'Cần bạn chú ý'} icon={student ? CheckCircle2 : Bell} tone="bg-emerald-50 text-emerald-700"/>
                  </div>
                </section>

                <section aria-labelledby="modules-title">
                  <div className="mb-4"><p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#e4661d]">LEARN · CREATE · ITERATE</p><h2 id="modules-title" className="mt-1 text-2xl font-extrabold tracking-tight text-[#0a2044]">Khám phá không gian học tập</h2><p className="mt-1 text-sm text-slate-500">Mọi hoạt động đều kết nối với dữ liệu thực và quyền truy cập của bạn.</p></div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <ModuleCard href="/learn" title="Learning Foundation" eyebrow="01 · Learn" text="Học theo dự án, ghi danh và lưu tiến độ." icon={GraduationCap} color="bg-blue-50 text-blue-700" index="1"/>
                    <ModuleCard href="/studio" title="Design Studio" eyebrow="02 · Create" text="Giải quyết thử thách cùng đội nhóm." icon={Layers3} color="bg-violet-50 text-violet-700" index="2"/>
                    <ModuleCard href="/evidence" title="Evidence & Iteration" eyebrow="03 · Document" text="Lưu dấu minh chứng, phiên bản và bài nộp." icon={FileText} color="bg-orange-50 text-orange-700" index="3"/>
                    <ModuleCard href={reviewer ? '/review' : '/notifications'} title={reviewer ? 'Assessment Studio' : 'Feedback & Growth'} eyebrow="04 · Improve" text={reviewer ? 'Rubric, chấm điểm và phản hồi có cấu trúc.' : 'Nhận phản hồi để tiếp tục cải tiến.'} icon={reviewer ? ClipboardCheck : RotateCcw} color="bg-emerald-50 text-emerald-700" index="4"/>
                  </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.035)] sm:p-6" aria-labelledby="next-title">
                    <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e4661d]">YOUR NEXT STEP</p><h2 id="next-title" className="mt-1 text-lg font-extrabold">Tiếp tục từ nơi bạn bắt đầu</h2></div><Link href={reviewer ? '/review' : '/learn'} className="inline-flex items-center gap-1 text-xs font-bold text-[#e4661d] hover:underline">Mở <ArrowUpRight size={14}/></Link></div>
                    {reviewer ? (
                      <div className="space-y-3">
                        {data.queue && data.queue.length > 0 ? data.queue.slice(0, 3).map((item) => <Link key={item.id} href="/review" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/40"><span><span className="block text-sm font-extrabold">{item.project.title}</span><span className="mt-1 block text-xs text-slate-500">Bài nộp đang chờ đánh giá</span></span><ChevronRight className="text-slate-400 group-hover:text-orange-600" size={18}/></Link>) : <div className="rounded-2xl bg-slate-50 p-5"><CheckCircle2 size={25} className="text-emerald-600"/><p className="mt-2 text-sm font-bold">{data.queue ? 'Chưa có bài chờ đánh giá' : 'Chưa tải được danh sách bài đánh giá'}</p><p className="mt-1 text-xs text-slate-500">Bạn có thể tiếp tục quản lý khóa học và challenge.</p></div>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {nextCourse && <Link href="/learn" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-200"><span className="min-w-0"><span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#e4661d]">Khóa đang tham gia</span><span className="mt-1 block truncate text-sm font-extrabold">{nextCourse.title}</span>{data.progress && <span className="mt-2 block h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-[#f37021]" style={{ width: data.progress.percent + '%' }}/></span>}</span><ChevronRight className="shrink-0 text-slate-400 group-hover:text-orange-600" size={18}/></Link>}
                        {topProject && <Link href="/studio" className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-200"><span><span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#e4661d]">Dự án gần đây</span><span className="mt-1 block text-sm font-extrabold">{topProject.title}</span><span className="mt-1 block text-xs text-slate-500">{stageName(topProject.currentStage)} · {topProject.status}</span></span><ChevronRight className="shrink-0 text-slate-400 group-hover:text-orange-600" size={18}/></Link>}
                        {!nextCourse && !topProject && <div className="rounded-2xl bg-slate-50 p-5"><BookOpen size={25} className="text-[#f37021]"/><p className="mt-2 text-sm font-bold">Khởi động hành trình của bạn</p><p className="mt-1 text-xs leading-5 text-slate-500">Chọn một khóa học đã xuất bản, ghi danh và bắt đầu giải quyết thử thách.</p><Link href="/learn" className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-[#e4661d]">Khám phá khóa học <ArrowRight size={16}/></Link></div>}
                      </div>
                    )}
                  </section>
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.035)] sm:p-6" aria-labelledby="updates-title">
                    <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e4661d]">STAY INFORMED</p><h2 id="updates-title" className="mt-1 text-lg font-extrabold">Thông báo mới</h2></div><Link href="/notifications" aria-label="Xem tất cả thông báo" className="rounded-xl bg-slate-50 p-2 text-slate-500 hover:text-[#f37021]"><ArrowUpRight size={18}/></Link></div>
                    {data.notifications?.length ? <div className="space-y-3">{data.notifications.slice(0, 3).map((note) => <div key={note.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"><span className={'mt-1 h-2 w-2 shrink-0 rounded-full ' + (note.readAt ? 'bg-slate-200' : 'bg-[#f37021]')}/><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold leading-5">{note.message}</p><p className="mt-1 text-[11px] text-slate-400">{new Date(note.createdAt).toLocaleDateString('vi-VN')}</p></div></div>)}</div> : <div className="rounded-2xl bg-slate-50 p-5 text-center"><Bell size={23} className="mx-auto text-slate-400"/><p className="mt-2 text-sm font-bold">{data.notifications ? 'Chưa có thông báo' : 'Chưa tải được thông báo'}</p><p className="mt-1 text-xs text-slate-500">Những phản hồi và hạn nộp sẽ xuất hiện tại đây.</p></div>}
                  </section>
                </div>

                <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 sm:p-7" aria-labelledby="modes-title">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e4661d]">DESIGN THINKING IN ACTION</p><h2 id="modes-title" className="mt-1 text-xl font-extrabold">Năm chế độ. Vô hạn vòng lặp.</h2><p className="mt-1 text-sm text-slate-500">Bạn có thể quay lại bất kỳ chế độ nào khi học được điều mới.</p></div><Link href="/studio" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#e4661d] hover:underline">Vào Design Studio <ArrowRight size={15}/></Link></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{modes.map(({title,subtitle,icon:Icon,tint})=><Link key={title} href="/studio" className="group rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-orange-200 hover:bg-orange-50/30"><span className={'inline-flex h-10 w-10 items-center justify-center rounded-xl ' + tint}><Icon size={19}/></span><p className="mt-3 text-sm font-extrabold">{title}</p><p className="mt-1 text-xs text-slate-500">{subtitle}</p></Link>)}</div>
                  <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><RotateCcw size={14} className="text-[#f37021]"/> Không có thứ tự bắt buộc — thử nghiệm, phản tư và lặp lại.</p>
                </section>
              </>
            )}

            {authReady && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500"><span className="font-semibold">UII Design Thinking Hub · MVP Staging</span><span className="inline-flex items-center gap-2"><span className="font-extrabold text-[#0a2044]">Build</span> → Measure → Learn → <span className="font-extrabold text-[#e4661d]">Improve</span></span></footer>}
          </main>
        </div>
      </div>
    </div>
  );
}
