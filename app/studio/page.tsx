'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, BookOpen, CheckCircle2, ClipboardList, FileText,
  Lightbulb, LoaderCircle, Plus, RefreshCcw, Send, Users, Workflow,
} from 'lucide-react';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type Role = 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR';
type User = { id: string; email: string; fullName: string; role: Role };
type Course = { id: string; title: string; status: string; createdById: string };
type Enrollment = { course: Course };
type Mode = 'EMPATHIZE' | 'DEFINE' | 'IDEATE' | 'PROTOTYPE' | 'TEST';
type ChallengeStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
type Milestone = { id: string; title: string; description?: string | null; dueAt?: string | null; mode?: Mode | null };
type Challenge = {
  id: string; courseId: string; title: string; brief: string; learningOutcomes?: string | null;
  status: ChallengeStatus; milestones: Milestone[]; _count?: { projects: number };
};
type TemplateField = { key: string; label: string; type: 'text' | 'textarea' };
type Template = { id: string; name: string; slug: string; description?: string | null; mode: Mode; instructions: string; fields: TemplateField[] };
type AssignedActivity = { id: string; challengeId: string; templateId: string; template: Template; instructions?: string | null; publishedAt?: string | null };
type Member = { id: string; userId: string; role: string; user: { id: string; fullName: string; email: string } };
type TeamTask = { id: string; title: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE'; assigneeId?: string | null };
type Team = {
  id: string; title: string; description?: string | null; ownerId: string; challengeId: string;
  members: Member[]; tasks: TeamTask[]; currentStage: Mode; challenge?: Challenge | null;
};
type Invitation = { id: string; project: { id: string; title: string; challenge?: { title: string } | null } };
type ProjectActivity = {
  id: string; templateId: string; template: Template; content: Record<string, string>;
  mode: Mode; status: 'DRAFT' | 'COMPLETED'; createdAt: string; updatedAt: string;
};

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'EMPATHIZE', label: 'Empathize', hint: 'Understand real users' },
  { id: 'DEFINE', label: 'Define', hint: 'Synthesize the core need' },
  { id: 'IDEATE', label: 'Ideate', hint: 'Generate divergent options' },
  { id: 'PROTOTYPE', label: 'Prototype', hint: 'Make an idea tangible' },
  { id: 'TEST', label: 'Test', hint: 'Learn from experiments' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer ' + token);
  if (init?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(API_URL + path, { ...init, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error('HTTP ' + response.status + ': ' + body.slice(0, 200));
  }
  return response.json() as Promise<T>;
}

const card = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-offset-2 focus:outline-[#f37021]';
const action = 'rounded-xl bg-[#153b77] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#214d91] disabled:cursor-not-allowed disabled:opacity-50';
const minor = 'rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#153b77] hover:bg-[#f5f8fd] disabled:opacity-50';

export default function DesignStudioPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assigned, setAssigned] = useState<AssignedActivity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [mode, setMode] = useState<Mode>('EMPATHIZE');
  const [activeActivity, setActiveActivity] = useState<ProjectActivity | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeBrief, setNewChallengeBrief] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [templateToAssign, setTemplateToAssign] = useState('');
  const [teamName, setTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const token = session?.access_token ?? '';
  const isTeacher = user?.role === 'LECTURER' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const canManageChallenge = !!challenge && isTeacher &&
    (user?.role === 'ADMIN' || courses.some((c) => c.id === challenge.courseId && c.createdById === user?.id));
  const isOwner = !!team && team.ownerId === user?.id;
  const canEditTeam = isStudent && !!team && team.members.some((m) => m.userId === user?.id);

  useEffect(() => {
    let mounted = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void auth.getSession().then(({ data }) => {
        if (mounted) { setSession(data.session); setAuthReady(true); }
      });
      const { data: { subscription } } = auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) setSession(nextSession);
      });
      return () => { mounted = false; subscription.unsubscribe(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Supabase is not configured.');
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null); setCourses([]); setCourseId(''); setChallenges([]);
      setChallenge(null); setTeam(null); setActivities([]); setInvitations([]);
      return;
    }
    let active = true;
    async function init() {
      setBusy(true);
      try {
        const [me, list] = await Promise.all([
          request<User>(token, '/auth/me'),
          request<Course[]>(token, '/courses'),
        ]);
        const enrolled = me.role === 'STUDENT'
          ? await request<Enrollment[]>(token, '/courses/my-enrollments')
          : null;
        const options = enrolled ? enrolled.map((e) => e.course) : list;
        const [availableTemplates, ownTeams, pendingInvitations] = await Promise.all([
          request<Template[]>(token, '/activity-templates'),
          me.role === 'STUDENT' ? request<Team[]>(token, '/teams/my') : Promise.resolve([]),
          me.role === 'STUDENT' ? request<Invitation[]>(token, '/team-invitations/my') : Promise.resolve([]),
        ]);
        if (!active) return;
        setUser(me); setCourses(options); setTemplates(availableTemplates);
        setMyTeams(ownTeams); setInvitations(pendingInvitations);
        setCourseId((prior) => options.some((c) => c.id === prior) ? prior : options[0]?.id ?? '');
        setError('');
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load studio.');
      } finally { if (active) setBusy(false); }
    }
    void init();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !courseId) { setChallenges([]); return; }
    let active = true;
    void request<Challenge[]>(token, '/courses/' + courseId + '/challenges')
      .then((list) => { if (active) setChallenges(list); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Challenge request failed.'); });
    return () => { active = false; };
  }, [courseId, token]);

  function clean() { setError(''); setNotice(''); }
  function report(err: unknown) { setError(err instanceof Error ? err.message : 'Operation failed.'); }
  async function run(fn: () => Promise<void>) {
    clean(); setBusy(true);
    try { await fn(); } catch (err) { report(err); } finally { setBusy(false); }
  }

  async function loadChallenge(challengeId: string) {
    const [detail, currentTeams, assignments] = await Promise.all([
      request<Challenge>(token, '/challenges/' + challengeId),
      request<Team[]>(token, '/challenges/' + challengeId + '/teams'),
      request<AssignedActivity[]>(token, '/challenges/' + challengeId + '/activities'),
    ]);
    setChallenge(detail); setTeams(currentTeams); setAssigned(assignments);
    setTeam(null); setActivities([]); setActiveActivity(null); setDirty(false);
  }

  async function loadTeam(projectId: string) {
    const [detail, saved] = await Promise.all([
      request<Team>(token, '/teams/' + projectId),
      request<ProjectActivity[]>(token, '/projects/' + projectId + '/activities'),
    ]);
    setTeam(detail); setActivities(saved); setActiveActivity(null); setAnswers({}); setDirty(false);
  }

  async function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const created = await request<Challenge>(token, '/courses/' + courseId + '/challenges', {
        method: 'POST', body: JSON.stringify({ title: newChallengeTitle, brief: newChallengeBrief }),
      });
      setNewChallengeTitle(''); setNewChallengeBrief('');
      await loadChallenge(created.id);
      setChallenges((list) => [created, ...list]);
      setNotice('Đã tạo Design Challenge dạng draft.');
    });
  }

  async function publishChallenge() {
    if (!challenge) return;
    await run(async () => {
      await request(token, '/challenges/' + challenge.id, {
        method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      await loadChallenge(challenge.id);
      setChallenges(await request<Challenge[]>(token, '/courses/' + courseId + '/challenges'));
      setNotice('Challenge đã được xuất bản.');
    });
  }

  async function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!challenge) return;
    await run(async () => {
      await request(token, '/challenges/' + challenge.id + '/milestones', {
        method: 'POST',
        body: JSON.stringify({ title: milestoneTitle, dueAt: milestoneDate ? new Date(milestoneDate).toISOString() : undefined, mode }),
      });
      setMilestoneTitle(''); setMilestoneDate('');
      await loadChallenge(challenge.id);
      setNotice('Đã thêm milestone.');
    });
  }

  async function assignTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!challenge || !templateToAssign) return;
    await run(async () => {
      await request(token, '/challenges/' + challenge.id + '/activities', {
        method: 'POST', body: JSON.stringify({ templateId: templateToAssign, isPublished: true }),
      });
      setTemplateToAssign('');
      await loadChallenge(challenge.id);
      setNotice('Đã gán hoạt động cho challenge.');
    });
  }

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!challenge) return;
    await run(async () => {
      const created = await request<Team>(token, '/challenges/' + challenge.id + '/teams', {
        method: 'POST', body: JSON.stringify({ name: teamName }),
      });
      setTeamName('');
      setTeams(await request<Team[]>(token, '/challenges/' + challenge.id + '/teams'));
      setMyTeams(await request<Team[]>(token, '/teams/my'));
      await loadTeam(created.id);
      setNotice('Đã tạo nhóm và project workspace.');
    });
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!team) return;
    await run(async () => {
      await request(token, '/teams/' + team.id + '/invitations', {
        method: 'POST', body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteEmail(''); setNotice('Đã gửi lời mời trong hệ thống.');
    });
  }

  async function respond(id: string, accept: boolean) {
    await run(async () => {
      await request(token, '/team-invitations/' + id + '/respond', {
        method: 'POST', body: JSON.stringify({ accept }),
      });
      setInvitations(await request<Invitation[]>(token, '/team-invitations/my'));
      setMyTeams(await request<Team[]>(token, '/teams/my'));
      if (challenge) setTeams(await request<Team[]>(token, '/challenges/' + challenge.id + '/teams'));
      setNotice(accept ? 'Đã tham gia nhóm.' : 'Đã từ chối lời mời.');
    });
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!team) return;
    await run(async () => {
      await request(token, '/teams/' + team.id + '/tasks', {
        method: 'POST', body: JSON.stringify({ title: taskTitle, assigneeId: taskAssigneeId || undefined }),
      });
      setTaskTitle(''); setTaskAssigneeId('');
      await loadTeam(team.id);
      setNotice('Đã tạo task.');
    });
  }

  async function updateTask(task: TeamTask) {
    if (!team) return;
    const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    await run(async () => {
      await request(token, '/teams/' + team.id + '/tasks/' + task.id, {
        method: 'PATCH', body: JSON.stringify({ status: next }),
      });
      await loadTeam(team.id);
      setNotice('Đã cập nhật task.');
    });
  }

  async function startActivity(template: Template) {
    if (!team) return;
    await run(async () => {
      const assignment = assigned.find((item) => item.templateId === template.id && item.publishedAt);
      const created = await request<ProjectActivity>(token, '/projects/' + team.id + '/activities', {
        method: 'POST', body: JSON.stringify({
          templateId: template.id,
          challengeActivityId: assignment?.id,
          content: {},
        }),
      });
      setActivities((items) => [created, ...items]);
      setActiveActivity(created); setAnswers({}); setDirty(false);
      setNotice('Đã mở bản nháp hoạt động.');
    });
  }

  function selectActivity(activity: ProjectActivity) {
    if (dirty && !window.confirm('Nội dung chưa lưu sẽ bị mất. Tiếp tục?')) return;
    setActiveActivity(activity); setAnswers(activity.content); setDirty(false);
  }

  function selectMode(next: Mode) {
    if (dirty && !window.confirm('Nội dung chưa lưu sẽ bị mất. Chuyển mode?')) return;
    setMode(next); setActiveActivity(null); setDirty(false); setAnswers({});
  }

  async function saveActivity(completed: boolean) {
    if (!activeActivity || !team) return;
    await run(async () => {
      const saved = await request<ProjectActivity>(token, '/project-activities/' + activeActivity.id, {
        method: 'PATCH',
        body: JSON.stringify({ content: answers, status: completed ? 'COMPLETED' : 'DRAFT' }),
      });
      setActiveActivity(saved);
      setActivities((items) => items.map((item) => item.id === saved.id ? saved : item));
      setDirty(false); setNotice(completed ? 'Hoạt động đã hoàn thành.' : 'Bản nháp đã được lưu trên server.');
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#153b77] p-3 text-white"><Workflow size={22}/></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f37021]">UII Design Thinking Hub</p>
              <h1 className="text-xl font-extrabold">Design Studio</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            {isTeacher && <Link href="/review" className="text-[#153b77] hover:underline">Assessment</Link>}
            <Link href="/notifications" className="text-[#153b77] hover:underline">Notifications</Link>
            <Link href="/evidence" className="flex items-center gap-1 text-[#153b77] hover:underline"><FileText size={16}/> Evidence</Link>
            <Link href="/learn" className="flex items-center gap-1 text-[#153b77] hover:underline"><BookOpen size={16}/> Learning Studio</Link>
            <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:underline"><ArrowLeft size={16}/> Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#f37021]">Release B · F05–F08</p>
            <h2 className="text-3xl font-extrabold">Challenge-Based Learning</h2>
            <p className="mt-1 text-sm text-slate-500">{user ? user.fullName + ' · ' + user.role : 'Đăng nhập để bắt đầu'}</p>
          </div>
          {busy && <span className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={17}/> Đang xử lý…</span>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
        {!authReady && <p>Đang kiểm tra đăng nhập…</p>}
        {authReady && !session && <div className={card}>Bạn cần đăng nhập trước. <Link href="/learn" className="font-bold text-[#153b77] underline">Mở trang đăng nhập</Link></div>}
        {session && user && (
          <>
            {isStudent && invitations.length > 0 && (
              <section className={card}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Users size={18}/> Lời mời tham gia nhóm ({invitations.length})</h3>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f3f7fc] p-3">
                      <span className="text-sm">{invitation.project.title} · {invitation.project.challenge?.title}</span>
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => void respond(invitation.id, true)} className={action}>Tham gia</button>
                        <button disabled={busy} onClick={() => void respond(invitation.id, false)} className={minor}>Từ chối</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <section className={card}>
                  <label htmlFor="course" className="mb-2 block text-sm font-bold">Khóa học</label>
                  <select id="course" className={input} value={courseId} onChange={(event) => {
                    setCourseId(event.target.value); setChallenge(null); setTeam(null); setActiveActivity(null);
                  }}>
                    {!courses.length && <option value="">Chưa ghi danh khóa học</option>}
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  {isStudent && !courses.length && <p className="mt-3 text-sm text-slate-500">Hãy <Link href="/learn" className="underline">ghi danh khóa học</Link> trước khi tham gia challenge.</p>}
                </section>
                <section className={card}>
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><Lightbulb size={18}/> Design Challenges</h3>
                  <div className="space-y-2">
                    {challenges.map((item) => (
                      <button key={item.id} onClick={() => void run(async () => { await loadChallenge(item.id); })}
                        className={'w-full rounded-xl border p-3 text-left text-sm hover:border-[#153b77] ' + (challenge?.id === item.id ? 'border-[#153b77] bg-[#eff4fb]' : 'bg-white')}>
                        <span className="block font-bold">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{item.status}</span>
                      </button>
                    ))}
                    {!challenges.length && <p className="text-sm text-slate-500">Chưa có challenge được hiển thị.</p>}
                  </div>
                </section>
                {isTeacher && courseId && (
                  <form onSubmit={(event) => void createChallenge(event)} className={card + ' space-y-3'}>
                    <h3 className="flex items-center gap-2 font-bold"><Plus size={18}/> Tạo challenge</h3>
                    <input required maxLength={160} className={input} placeholder="Tên challenge" value={newChallengeTitle} onChange={(e) => setNewChallengeTitle(e.target.value)}/>
                    <textarea required maxLength={6000} rows={4} className={input} placeholder="Bối cảnh và vấn đề người dùng" value={newChallengeBrief} onChange={(e) => setNewChallengeBrief(e.target.value)}/>
                    <button disabled={busy} className={action}>Tạo challenge nháp</button>
                  </form>
                )}
              </aside>

              <div className="min-w-0 space-y-5">
                {!challenge ? <section className={card + ' py-16 text-center'}>
                  <Lightbulb className="mx-auto mb-3 text-[#f37021]" size={35}/>
                  <h3 className="text-xl font-bold">Chọn một Design Challenge</h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Giảng viên tạo bài toán thực tế. Sinh viên thành lập nhóm, sử dụng các activity templates và lưu tiến trình qua API.</p>
                </section> : (
                  <>
                    <section className={card}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-[#eaf0fa] px-3 py-1 text-xs font-bold text-[#153b77]">{challenge.status}</span>
                        {canManageChallenge && challenge.status === 'DRAFT' &&
                          <button disabled={busy} className={action} onClick={() => void publishChallenge()}>Xuất bản challenge</button>}
                      </div>
                      <h3 className="text-2xl font-extrabold">{challenge.title}</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{challenge.brief}</p>
                      {challenge.learningOutcomes && <p className="mt-2 text-sm">Mục tiêu: {challenge.learningOutcomes}</p>}
                      {challenge.milestones.length > 0 && <div className="mt-5 border-t pt-4">
                        <p className="mb-2 text-sm font-bold">Milestones</p>
                        <div className="space-y-2">{challenge.milestones.map((m) => <p key={m.id} className="text-sm text-slate-600">
                          <span className="font-semibold">{m.title}</span>{m.mode && ' · ' + m.mode}
                          {m.dueAt && ' · ' + new Date(m.dueAt).toLocaleString('vi-VN')}
                        </p>)}</div>
                      </div>}
                    </section>
                    {canManageChallenge && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <form onSubmit={(event) => void createMilestone(event)} className={card + ' space-y-3'}>
                          <h4 className="font-bold">Thêm milestone</h4>
                          <input required maxLength={160} className={input} placeholder="Milestone title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)}/>
                          <input type="datetime-local" aria-label="Deadline" className={input} value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)}/>
                          <button className={minor} disabled={busy}>Lưu milestone</button>
                        </form>
                        <form onSubmit={(event) => void assignTemplate(event)} className={card + ' space-y-3'}>
                          <h4 className="font-bold">Gán activity template</h4>
                          <select required className={input} value={templateToAssign} onChange={(e) => setTemplateToAssign(e.target.value)}>
                            <option value="">Chọn template</option>
                            {templates.filter((t) => !assigned.some((a) => a.templateId === t.id)).map((t) => <option key={t.id} value={t.id}>{t.mode} · {t.name}</option>)}
                          </select>
                          <button disabled={busy || !templateToAssign} className={minor}>Gán vào challenge</button>
                        </form>
                      </div>
                    )}

                    <section className={card}>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-lg font-bold"><Users size={20}/> Nhóm thực hiện</h3>
                        {challenge && <span className="text-xs text-slate-500">{teams.length} nhóm có thể truy cập</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teams.map((item) => <button key={item.id} className={team?.id === item.id ? action : minor}
                          onClick={() => void run(async () => { await loadTeam(item.id); })}>{item.title}</button>)}
                      </div>
                      {isStudent && challenge.status === 'PUBLISHED' && teams.length === 0 && (
                        <form onSubmit={(event) => void createTeam(event)} className="mt-4 flex flex-wrap gap-2">
                          <input required maxLength={160} className={input + ' min-w-48 flex-1'} placeholder="Tên nhóm / dự án" value={teamName} onChange={(e) => setTeamName(e.target.value)}/>
                          <button disabled={busy} className={action}><Plus size={16} className="mr-1 inline"/> Tạo nhóm</button>
                        </form>
                      )}
                    </section>

                    {team && (
                      <>
                        <section className={card}>
                          <h3 className="mb-3 text-lg font-bold">{team.title} · Team Workspace</h3>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {team.members.map((m) => <span key={m.id} className="rounded-full bg-[#eaf0fa] px-3 py-1.5 text-xs font-semibold">
                              {m.user.fullName} · {m.role}
                            </span>)}
                          </div>
                          {isOwner && <form onSubmit={(event) => void invite(event)} className="mb-4 flex flex-wrap gap-2">
                            <input required type="email" className={input + ' min-w-52 flex-1'} placeholder="Email thành viên đã ghi danh" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}/>
                            <button disabled={busy} className={minor}><Send size={15} className="mr-1 inline"/> Mời</button>
                          </form>}
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><ClipboardList size={17}/> Taskboard</h4>
                          <div className="space-y-2">
                            {team.tasks.map((task) => (
                              <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f6f8fc] p-3">
                                <span className="text-sm">{task.title}
                                  <span className="ml-2 text-xs text-slate-400">{team.members.find((m) => m.userId === task.assigneeId)?.user.fullName || 'Unassigned'}</span>
                                </span>
                                <button type="button" className={minor} disabled={!canEditTeam || busy} onClick={() => void updateTask(task)}>{task.status.replace('_', ' ')}</button>
                              </div>
                            ))}
                            {!team.tasks.length && <p className="text-sm text-slate-500">Chưa có công việc nào.</p>}
                          </div>
                          {canEditTeam && <form onSubmit={(event) => void createTask(event)} className="mt-3 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
                            <input required maxLength={160} className={input} placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}/>
                            <select className={input} aria-label="Giao việc cho" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                              <option value="">Unassigned</option>
                              {team.members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
                            </select>
                            <button disabled={busy} className={minor}>+ Task</button>
                          </form>}
                        </section>

                        <section className={card}>
                          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Design Thinking modes">
                            {MODES.map((item) => (
                              <button key={item.id} type="button" role="tab" aria-selected={mode === item.id}
                                onClick={() => selectMode(item.id)}
                                className={'rounded-xl px-3 py-3 text-xs font-bold sm:text-sm ' + (mode === item.id ? 'bg-[#153b77] text-white' : 'bg-[#eef2f8] text-[#153b77]')}>
                                {item.label}
                              </button>
                            ))}
                          </div>
                          <h3 className="text-xl font-extrabold">{MODES.find((m) => m.id === mode)?.label} Workspace</h3>
                          <p className="mb-4 text-sm text-slate-500">{MODES.find((m) => m.id === mode)?.hint} · Có thể quay lại bất kỳ mode nào.</p>

                          <div className="mb-5 grid gap-3 sm:grid-cols-2">
                            {templates.filter((t) => t.mode === mode).map((template) => (
                              <div key={template.id} className="rounded-xl border border-[#e6eaf2] bg-[#fbfcfe] p-4">
                                <p className="font-bold">{template.name}</p>
                                <p className="my-2 text-xs leading-5 text-slate-500">{template.instructions}</p>
                                {canEditTeam && <button disabled={busy} className={minor} onClick={() => void startActivity(template)}><Plus size={14} className="mr-1 inline"/> Bắt đầu</button>}
                                {assigned.some((a) => a.templateId === template.id) && <p className="mt-2 text-xs font-semibold text-emerald-700">Được giao bởi giảng viên</p>}
                              </div>
                            ))}
                          </div>

                          <h4 className="mb-2 text-sm font-bold">Activities đã lưu</h4>
                          <div className="mb-5 flex flex-wrap gap-2">
                            {activities.filter((a) => a.mode === mode).map((a) => (
                              <button key={a.id} className={activeActivity?.id === a.id ? action : minor} onClick={() => selectActivity(a)}>
                                <FileText size={14} className="mr-1 inline"/>{a.template.name} · {a.status}
                              </button>
                            ))}
                          </div>

                          {activeActivity && (
                            <div className="space-y-4 rounded-xl border border-[#dfe6f1] bg-[#f8fafd] p-4 sm:p-5">
                              <div>
                                <h4 className="text-lg font-bold">{activeActivity.template.name}</h4>
                                <p className="mt-1 text-xs text-slate-500">{activeActivity.template.instructions}</p>
                              </div>
                              {activeActivity.template.fields.map((field) => (
                                <label key={field.key} className="block text-sm font-semibold">{field.label}
                                  {field.type === 'textarea' ?
                                    <textarea rows={4} maxLength={5000} disabled={!canEditTeam}
                                      className={input + ' mt-2'} value={answers[field.key] ?? ''}
                                      onChange={(event) => { setAnswers((prev) => ({ ...prev, [field.key]: event.target.value })); setDirty(true); }}/>
                                    : <input type="text" maxLength={5000} disabled={!canEditTeam}
                                      className={input + ' mt-2'} value={answers[field.key] ?? ''}
                                      onChange={(event) => { setAnswers((prev) => ({ ...prev, [field.key]: event.target.value })); setDirty(true); }}/>}
                                </label>
                              ))}
                              {canEditTeam && <div className="flex flex-wrap gap-3">
                                <button disabled={busy} className={minor} onClick={() => void saveActivity(false)}><RefreshCcw size={15} className="mr-1 inline"/> Lưu nháp</button>
                                <button disabled={busy} className={action} onClick={() => void saveActivity(true)}><CheckCircle2 size={15} className="mr-1 inline"/> Hoàn thành activity</button>
                              </div>}
                              {dirty && <p className="text-xs font-semibold text-amber-700">Có thay đổi chưa lưu.</p>}
                            </div>
                          )}
                        </section>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
