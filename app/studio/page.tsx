'use client';

import Link from 'next/link';
import { WorkspaceLoading } from '@/components/workspace-loading';
import { WorkspaceNav } from '@/components/workspace-nav';
import { ProjectDiscussion } from '@/components/project-discussion';
import { ExternalCollaborationBoard } from '@/components/external-collaboration-board';
import { SampleTeamGallery } from '@/components/learning-stage-workbench';
import { StudioGuidedJourney } from '@/components/studio-guided-journey';
import { getStudioGuidedStep } from '@/lib/studio-guidance';
import { guideForStage } from '@/lib/stage-experience';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, BookOpen, CheckCircle2, ClipboardList, FileText,
  Lightbulb, LoaderCircle, Plus, RefreshCcw, Send, Users, Workflow,
} from 'lucide-react';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi, workspaceProfile } from '@/lib/authenticated-api';
import { withAuthDeadline } from '@/lib/auth-timeout';

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


async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return authenticatedApi<T>(path, token, init);
}

const card = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5';
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
  const guidedAutoOpenedCourse = useRef('');
  // Deep-link to the selected d.school mode from a course lesson. This is a
  // navigation preference only; challenge/team authorization is still server-side.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('mode');
    if (requested && MODES.some(item => item.id === requested)) setMode(requested as Mode);
  }, []);
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
  const guidedStep = getStudioGuidedStep({ courseId, challenges,
    challengeId: challenge?.id ?? null, teamId: team?.id ?? null,
    myTeams, invitationCount: invitations.length, templates, activities, mode,
  });
  const completedActivities = activities.filter(item => item.status === 'COMPLETED').length;

  useEffect(() => {
    let mounted = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void withAuthDeadline(() => auth.getSession()).then(({ data }) => {
        if (mounted) { setSession(data.session); setAuthReady(true); }
      }).catch((err: unknown) => { setError(err instanceof Error ? err.message : 'Unable to read the sign-in session.'); setAuthReady(true); });
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
          workspaceProfile<User>(token),
          request<Course[]>(token, '/courses'),
        ]);
        const [enrolled, availableTemplates, ownTeams, pendingInvitations] = await Promise.all([
          me.role === 'STUDENT' ? request<Enrollment[]>(token, '/courses/my-enrollments') : Promise.resolve(null),
          request<Template[]>(token, '/activity-templates'),
          me.role === 'STUDENT' ? request<Team[]>(token, '/teams/my') : Promise.resolve([]),
          me.role === 'STUDENT' ? request<Invitation[]>(token, '/team-invitations/my') : Promise.resolve([]),
        ]);
        if (!active) return;
        const options = enrolled ? enrolled.map((e) => e.course) : list;
        setUser(me); setCourses(options); setTemplates(availableTemplates);
        setMyTeams(ownTeams); setInvitations(pendingInvitations);
        const requestedCourse = new URLSearchParams(window.location.search).get('course');
        setCourseId((prior) => options.some(c => c.id === requestedCourse)
          ? requestedCourse!
          : options.some(c => c.id === prior) ? prior : options[0]?.id ?? '');
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

  // Course Player -> Compass -> Studio now preserves the real learning context.
  // The backend remains the source of authorization for challenge and team IDs.
  useEffect(() => {
    if (!token || user?.role !== 'STUDENT' || !courseId || challenges.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('mode') || guidedAutoOpenedCourse.current === courseId) return;
    const eligible = challenges.filter(item => item.courseId === courseId);
    const inCourseTeam = myTeams.find(item => item.challenge?.courseId === courseId);
    const picked = eligible.find(item => item.id === params.get('challenge')) ||
      eligible.find(item => item.id === inCourseTeam?.challengeId) ||
      eligible.find(item => item.status === 'PUBLISHED');
    if (!picked) return;
    guidedAutoOpenedCourse.current = courseId;
    void run(async () => {
      await loadChallenge(picked.id);
      const mine = myTeams.find(item => item.challengeId === picked.id);
      if (mine) await loadTeam(mine.id);
    });
  }, [token, courseId, user?.role, challenges, myTeams]);

  useEffect(() => {
    if (!team || window.location.hash !== '#project-discussion') return;
    const id = window.requestAnimationFrame(() => {
      document.getElementById('project-discussion')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    return () => window.cancelAnimationFrame(id);
  }, [team]);

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
      setNotice('Draft Design Challenge created.');
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
      setNotice('Challenge published.');
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
      setNotice('Milestone added.');
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
      setNotice('Activity assigned to the challenge.');
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
      setNotice('Team and project workspace created.');
    });
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!team) return;
    await run(async () => {
      await request(token, '/teams/' + team.id + '/invitations', {
        method: 'POST', body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteEmail(''); setNotice('Invitation sent.');
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
      setNotice(accept ? 'Joined the team.' : 'Invitation declined.');
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
      setNotice('Task created.');
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
      setNotice('Task updated.');
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
      setNotice('Activity draft opened.');
    });
  }

  function selectActivity(activity: ProjectActivity) {
    if (dirty && !window.confirm('Unsaved changes will be lost. Continue?')) return;
    setActiveActivity(activity); setAnswers(activity.content); setDirty(false);
  }

  function selectMode(next: Mode) {
    if (dirty && !window.confirm('Unsaved changes will be lost. Switch stage?')) return;
    setMode(next); setActiveActivity(null); setDirty(false); setAnswers({});
    const params = new URLSearchParams(window.location.search);
    params.set('mode', next);
    if (courseId) params.set('course', courseId);
    window.history.replaceState(window.history.state, '', '/studio?' + params.toString());
  }

  function guideTo(id: string) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(id);
        target?.scrollIntoView({ behavior: 'auto', block: 'start' });
        target?.focus({ preventScroll: true });
      });
    });
  }

  async function followStudioGuide() {
    if (busy) return;
    if (guidedStep.kind === 'choose-challenge' && guidedStep.resourceId) {
      await run(async () => { await loadChallenge(guidedStep.resourceId!); });
      guideTo('studio-challenge-detail');
    } else if (guidedStep.kind === 'choose-team' && guidedStep.resourceId) {
      await run(async () => { await loadTeam(guidedStep.resourceId!); });
      guideTo('studio-team-workspace');
    } else if (guidedStep.kind === 'accept-invitation') {
      guideTo('studio-invitations');
    } else if (guidedStep.kind === 'create-team') {
      guideTo('studio-create-team');
    } else if (guidedStep.kind === 'start' && guidedStep.resourceId) {
      const selected = templates.find(item => item.id === guidedStep.resourceId);
      if (selected && canEditTeam) {
        await startActivity(selected);
        guideTo('studio-activity-editor');
      } else {
        guideTo('studio-stage-tools');
      }
    } else if (guidedStep.kind === 'resume' && guidedStep.resourceId) {
      const draft = activities.find(item => item.id === guidedStep.resourceId);
      if (draft && activeActivity?.id !== draft.id) selectActivity(draft);
      guideTo('studio-activity-editor');
    } else {
      guideTo('studio-stage-tools');
    }
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
      setDirty(false); setNotice(completed ? 'Activity completed.' : 'Draft saved on the server.');
    });
  }

  return (
    <div className="uii-workspace min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <WorkspaceNav title="Project Workspace" role={user?.role} guest={authReady && !session} />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:space-y-6 sm:px-5 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-[#d5edc4] p-5 sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.15em] text-[#95402a]">LEARN BY MAKING · PROJECT STUDIO</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Turn ideas into something you can test.</h1>
            <p className="mt-1 text-sm font-semibold text-[#3f5860]">Projects · From challenges to prototypes, evidence, and iteration.</p>
            <p className="mt-1 text-sm text-slate-600">{user ? user.fullName + ' · ' + user.role : 'Sign in to begin'}</p>
          </div>
          {busy && user && <span className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="animate-spin" size={17}/> Saving or loading changes…</span>}
        </div>
        {session && !user && busy && <WorkspaceLoading label="Verifying your account…"/>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
        {!authReady && <p>Checking sign-in…</p>}
        {authReady && !session && <div className={card}>Sign in to continue. <Link href="/learn" className="font-bold text-[#153b77] underline">Open Sign in</Link></div>}
        {session && user && (
          <>
            {isStudent && <StudioGuidedJourney
              step={guidedStep} stage={mode} completedCount={completedActivities}
              busy={busy} onAction={() => void followStudioGuide()}
              onSelectStage={next => selectMode(next)}
            />}
            {isStudent && invitations.length > 0 && (
              <section id="studio-invitations" tabIndex={-1} className={card}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Users size={18}/> Team invitations ({invitations.length})</h3>
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f3f7fc] p-3">
                      <span className="text-sm">{invitation.project.title} · {invitation.project.challenge?.title}</span>
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => void respond(invitation.id, true)} className={action}>Tham gia</button>
                        <button disabled={busy} onClick={() => void respond(invitation.id, false)} className={minor}>Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
              <aside className="space-y-5">
                <section className={card}>
                  <label htmlFor="course" className="mb-2 block text-sm font-bold">Courses</label>
                  <select id="course" className={input} value={courseId} onChange={(event) => {
                    setCourseId(event.target.value); setChallenge(null); setTeam(null); setActiveActivity(null);
                  }}>
                    {!courses.length && <option value="">No enrolled courses</option>}
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  {isStudent && !courses.length && <p className="mt-3 text-sm text-slate-600">Please <Link href="/learn" className="underline">enroll in a course</Link> before joining a challenge.</p>}
                </section>
                <section className={card}>
                  <h3 className="mb-3 flex items-center gap-2 font-bold"><Lightbulb size={18}/> Design Challenges</h3>
                  <div className="space-y-2">
                    {challenges.map((item) => (
                      <button key={item.id} onClick={() => void run(async () => { await loadChallenge(item.id); })}
                        className={'w-full rounded-xl border p-3 text-left text-sm hover:border-[#153b77] ' + (challenge?.id === item.id ? 'border-[#153b77] bg-[#eff4fb]' : 'bg-white')}>
                        <span className="block font-bold">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-600">{item.status}</span>
                      </button>
                    ))}
                    {!challenges.length && <p className="text-sm text-slate-600">No challenges are available.</p>}
                  </div>
                </section>
                {isTeacher && courseId && (
                  <form onSubmit={(event) => void createChallenge(event)} className={card + ' space-y-3'}>
                    <h3 className="flex items-center gap-2 font-bold"><Plus size={18}/> Create challenge</h3>
                    <input required maxLength={160} className={input} placeholder="Challenge title" value={newChallengeTitle} onChange={(e) => setNewChallengeTitle(e.target.value)}/>
                    <textarea required maxLength={6000} rows={4} className={input} placeholder="Context and user problem" value={newChallengeBrief} onChange={(e) => setNewChallengeBrief(e.target.value)}/>
                    <button disabled={busy} className={action}>Create draft challenge</button>
                  </form>
                )}
              </aside>

              <div className="min-w-0 space-y-5">
                {!challenge ? <section className={card + ' py-12 text-center'}>
                  <Lightbulb className="mx-auto mb-3 text-[#ad4007]" size={35}/>
                  <h3 className="text-xl font-bold">Choose a challenge</h3>
                  <p role="status" className="mt-2 text-sm font-semibold text-[#153b77]">Your compass: {MODES.find(item => item.id === mode)?.label} · Choose a challenge to practise this stage.</p>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Choose a course challenge, form a team, and explore the five Design Thinking stages.</p>
                  <details className="mx-auto mt-5 max-w-3xl rounded-xl border border-[#d6e2db] bg-white p-4 text-left">
                    <summary className="min-h-11 cursor-pointer text-sm font-bold text-[#315d57]">View two example teams · for reference only</summary>
                    <div className="mt-3"><SampleTeamGallery stage={mode}/></div>
                  </details>
                </section> : (
                  <>
                    <section id="studio-challenge-detail" tabIndex={-1} className={card}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-[#eaf0fa] px-3 py-1 text-xs font-bold text-[#153b77]">{challenge.status}</span>
                        {canManageChallenge && challenge.status === 'DRAFT' &&
                          <button disabled={busy} className={action} onClick={() => void publishChallenge()}>Publish challenge</button>}
                      </div>
                      <h3 className="text-2xl font-extrabold">{challenge.title}</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{challenge.brief}</p>
                      {challenge.learningOutcomes && <p className="mt-2 text-sm">Learning outcomes: {challenge.learningOutcomes}</p>}
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
                          <h4 className="font-bold">Add milestone</h4>
                          <input required maxLength={160} className={input} placeholder="Milestone title" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)}/>
                          <input type="datetime-local" aria-label="Deadline" className={input} value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)}/>
                          <button className={minor} disabled={busy}>Save milestone</button>
                        </form>
                        <form onSubmit={(event) => void assignTemplate(event)} className={card + ' space-y-3'}>
                          <h4 className="font-bold">Assign activity template</h4>
                          <select required className={input} value={templateToAssign} onChange={(e) => setTemplateToAssign(e.target.value)}>
                            <option value="">Choose a template</option>
                            {templates.filter((t) => !assigned.some((a) => a.templateId === t.id)).map((t) => <option key={t.id} value={t.id}>{t.mode} · {t.name}</option>)}
                          </select>
                          <button disabled={busy || !templateToAssign} className={minor}>Assign to challenge</button>
                        </form>
                      </div>
                    )}

                    <section className={card}>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-lg font-bold"><Users size={20}/> Project teams</h3>
                        {challenge && <span className="text-xs text-slate-600">{teams.length} teams can access</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teams.map((item) => <button key={item.id} className={team?.id === item.id ? action : minor}
                          onClick={() => void run(async () => { await loadTeam(item.id); })}>{item.title}</button>)}
                      </div>
                      {isStudent && challenge.status === 'PUBLISHED' && !myTeams.some(item => item.challengeId === challenge.id) && (
                        <form id="studio-create-team" tabIndex={-1} onSubmit={(event) => void createTeam(event)} className="mt-4 flex flex-wrap gap-2">
                          <input required maxLength={160} className={input + ' min-w-0 flex-1'} placeholder="Team / project name" value={teamName} onChange={(e) => setTeamName(e.target.value)}/>
                          <button disabled={busy} className={action}><Plus size={16} className="mr-1 inline"/> Create team</button>
                        </form>
                      )}
                    </section>

                    {!team && <section className={card}>
                      <h3 className="text-lg font-black text-[#173445]">What will you do in the {guideForStage(mode).title}?</h3>
                      <p className="mt-2 text-sm leading-7 text-[#526970]">{guideForStage(mode).question}</p>
                      <p className="mt-2 text-xs font-semibold text-[#ac4f3b]">Deliverable: {guideForStage(mode).deliverable}</p>
                      <details className="mt-4 rounded-xl border border-[#d6e2db] bg-white p-3">
                        <summary className="min-h-11 cursor-pointer text-sm font-bold text-[#315d57]">View an example for this stage</summary>
                        <div className="mt-2"><SampleTeamGallery stage={mode} compact/></div>
                      </details>
                      <p className="mt-3 text-sm text-[#526970]">Choose an existing team or create one to save actual work. The example above is synthetic.</p>
                    </section>}
                    {team && (
                      <>
                        <section id="studio-team-workspace" tabIndex={-1} className={card}>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                             <h3 className="text-lg font-black">{team.title} · Team Workspace</h3>
                             <Link href={"/evidence?projectId="+encodeURIComponent(team.id)} className="inline-flex min-h-11 items-center rounded-full bg-[#173445] px-4 text-xs font-black text-white hover:bg-[#285365]">Submit evidence or a Drive link ↗</Link>
                           </div>
                          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#eaf3ed] p-3 text-xs leading-6 text-[#365d57]">
                            <span className="flex-1">Want your project to appear in the Community? Submit work, receive an assessment, request lecturer approval for display, and publish only with the team’s permission.</span>
                            <Link href="/community" className="inline-flex min-h-11 items-center rounded-full border border-[#c0dbca] bg-white px-3 font-black">Open Community →</Link>
                          </div>
                          <div className="mb-4 flex flex-wrap gap-2">
                            {team.members.map((m) => <span key={m.id} className="rounded-full bg-[#eaf0fa] px-3 py-1.5 text-xs font-semibold">
                              {m.user.fullName} · {m.role}
                            </span>)}
                          </div>
                          {isOwner && <form onSubmit={(event) => void invite(event)} className="mb-4 flex flex-wrap gap-2">
                            <input required type="email" className={input + ' min-w-0 flex-1'} placeholder="Enrolled team member's email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}/>
                            <button disabled={busy} className={minor}><Send size={15} className="mr-1 inline"/> Invite</button>
                          </form>}
                          <details className="mt-4 rounded-xl border border-[#d7e4db] bg-[#f9fbf8] p-3">
                            <summary className="min-h-11 cursor-pointer text-sm font-bold text-[#365d57]">Manage team tasks · optional</summary>
                            <div className="mt-3">
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
                            {!team.tasks.length && <p className="text-sm text-slate-600">No tasks yet.</p>}
                          </div>
                          {canEditTeam && <form onSubmit={(event) => void createTask(event)} className="mt-3 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto]">
                            <input required maxLength={160} className={input} placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}/>
                            <select className={input} aria-label="Assign task to" value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)}>
                              <option value="">Unassigned</option>
                              {team.members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
                            </select>
                            <button disabled={busy} className={minor}>+ Task</button>
                          </form>}
                            </div>
                          </details>
                        </section>

                        <ProjectDiscussion projectId={team.id} token={token} viewerId={user.id}/>
                        <details className="rounded-2xl border border-[#dae5de] bg-white p-4">
                          <summary className="min-h-11 cursor-pointer text-sm font-bold text-[#365d57]">External collaboration board · optional</summary>
                          <div className="mt-3"><ExternalCollaborationBoard/></div>
                        </details>
                        <section id="studio-stage-tools" tabIndex={-1} className={card}>
                          <div className="mb-5 flex min-w-0 flex-wrap gap-2" role="tablist" aria-label="Five Design Thinking stages">
                            {MODES.map((item) => (
                              <button key={item.id} type="button" role="tab" aria-selected={mode === item.id}
                                onClick={() => selectMode(item.id)}
                                className={'rounded-xl px-3 py-3 text-xs font-bold sm:text-sm ' + (mode === item.id ? 'bg-[#153b77] text-white' : 'bg-[#eef2f8] text-[#153b77]')}>
                                {item.label}{mode === item.id && <span className="ml-2 text-[11px] font-bold">· You are here</span>}
                              </button>
                            ))}
                          </div>
                          <h3 className="text-xl font-extrabold">{MODES.find((m) => m.id === mode)?.label} Workspace</h3>
                          <p className="mt-2 text-sm font-bold text-[#274951]">{guideForStage(mode).question}</p>
                          <p className="mt-1 text-xs leading-6 text-[#65757a]">Deliverable: {guideForStage(mode).deliverable}</p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {guideForStage(mode).prompts.map((q,i)=><p key={q} className="rounded-xl border border-[#dce5df] bg-[#fbfaf5] p-3 text-xs leading-6"><span className="font-black text-[#a94330]">0{i+1}. </span>{q}</p>)}
                          </div>
                           <Link href={"/demo?tool="+encodeURIComponent(mode==="EMPATHIZE"?"Empathy Map":mode==="DEFINE"?"POV Builder":mode==="IDEATE"?"Crazy 8s":mode==="PROTOTYPE"?"Storyboard":"Feedback Canvas")+"#tools"}
                             className="my-3 inline-flex min-h-11 items-center rounded-full border border-[#aacabd] bg-[#eaf5e6] px-4 text-xs font-black text-[#173445]">
                             Open the practice canvas for {mode} ↗
                           </Link>
                          <p className="mb-4 text-sm text-slate-600">{MODES.find((m) => m.id === mode)?.hint} · You can revisit any stage.</p>

                          <div className="mb-5 grid gap-3 sm:grid-cols-2">
                            {templates.filter((t) => t.mode === mode).map((template) => (
                              <div key={template.id} className="rounded-xl border border-[#e6eaf2] bg-[#fbfcfe] p-4">
                                <p className="font-bold">{template.name}</p>
                                <p className="my-2 text-xs leading-5 text-slate-600">{template.instructions}</p>
                                {canEditTeam && <button disabled={busy} className={minor} onClick={() => void startActivity(template)}><Plus size={14} className="mr-1 inline"/> Start</button>}
                                {assigned.some((a) => a.templateId === template.id) && <p className="mt-2 text-xs font-semibold text-emerald-700">Assigned by lecturer</p>}
                              </div>
                            ))}
                          </div>

                          <h4 className="mb-2 text-sm font-bold">Saved activities</h4>
                          <div className="mb-5 flex flex-wrap gap-2">
                            {activities.filter((a) => a.mode === mode).map((a) => (
                              <button key={a.id} className={activeActivity?.id === a.id ? action : minor} onClick={() => selectActivity(a)}>
                                <FileText size={14} className="mr-1 inline"/>{a.template.name} · {a.status}
                              </button>
                            ))}
                          </div>

                          {activeActivity && (
                            <div id="studio-activity-editor" tabIndex={-1} className="space-y-4 rounded-xl border border-[#dfe6f1] bg-[#f8fafd] p-4 sm:p-5">
                              <div>
                                <h4 className="text-lg font-bold">{activeActivity.template.name}</h4>
                                <p className="mt-1 text-xs text-slate-600">{activeActivity.template.instructions}</p>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                              {activeActivity.template.fields.map((field, fieldIndex) => (
                                <label key={field.key} className="min-w-0 rounded-2xl border border-[#d3deda] p-4 text-sm font-extrabold text-[#173445]" style={{backgroundColor:["#ffe4b8","#c5edf1","#f7d7e2","#dcefc9"][fieldIndex%4]}}>{field.label}
                                  {field.type === 'textarea' ?
                                    <textarea rows={4} maxLength={5000} disabled={!canEditTeam}
                                      className={input + ' mt-2'} value={answers[field.key] ?? ''}
                                      onChange={(event) => { setAnswers((prev) => ({ ...prev, [field.key]: event.target.value })); setDirty(true); }}/>
                                    : <input type="text" maxLength={5000} disabled={!canEditTeam}
                                      className={input + ' mt-2'} value={answers[field.key] ?? ''}
                                      onChange={(event) => { setAnswers((prev) => ({ ...prev, [field.key]: event.target.value })); setDirty(true); }}/>}
                                </label>
                              ))}
                              </div>
                              <p className="text-xs leading-6 text-[#65787a]">These entries are saved as team activities on the server. For a detailed empathy map or storyboard, use the Miro canvas in the toolkit.</p>
                              {canEditTeam && <div className="flex flex-wrap gap-3">
                                <button disabled={busy} className={minor} onClick={() => void saveActivity(false)}><RefreshCcw size={15} className="mr-1 inline"/> Save draft</button>
                                <button disabled={busy} className={action} onClick={() => void saveActivity(true)}><CheckCircle2 size={15} className="mr-1 inline"/> Complete activity</button>
                              </div>}
                              {dirty && <p className="text-xs font-semibold text-amber-700">You have unsaved changes.</p>}
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
