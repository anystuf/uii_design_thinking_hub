'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, FileText, FolderKanban, RefreshCcw, ShieldCheck } from 'lucide-react';

import { WorkspaceNav } from '@/components/workspace-nav';
import { TeacherClassroomBoard } from '@/components/teacher-classroom-board';
import { WorkspaceLoading } from '@/components/workspace-loading';
import { authenticatedApi, workspaceProfile } from '@/lib/authenticated-api';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { withAuthDeadline } from '@/lib/auth-timeout';
import {
  studentClassroomNextAction,
  teacherClassroomNextAction,
  type StudentClassroomData,
  type TeacherClassroomData,
} from '@/lib/classroom-next-action';

type Account = { id: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR'; fullName: string };
type Course = { id: string; title: string; status: string; createdById?: string };
type Enrollment = { id: string; courseId: string; course: Course };
type Team = { id: string; title: string; currentStage: string; challengeId?: string | null; challenge?: { title: string } };
type Activity = { id: string; status: string };
type Evidence = { id: string; versions?: { id: string }[] };
type Submission = { id: string; status: string; version: number; submittedAt: string };
type Challenge = { id: string; title: string; status: string };
type Rubric = { versions?: { status: string }[] };

const card = 'rounded-[22px] border border-[#d7dfda] bg-white p-5 shadow-sm sm:p-6';
const actionStyle = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white hover:bg-[#285365] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-orange-500';
const secondaryStyle = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b8c9c1] bg-white px-5 py-3 text-sm font-bold text-[#173445] hover:bg-[#f1f6f2]';

function ActionLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link href={href} className={secondary ? secondaryStyle : actionStyle}>{children}<ArrowRight aria-hidden="true" size={16}/></Link>;
}

function StepGuide({ student }: { student: boolean }) {
  const steps = student
    ? ['Join course & team', 'Complete activity', 'Save evidence', 'Submit work', 'Get feedback & revise']
    : ['Open course', 'Assign challenge', 'Publish rubric', 'Review submissions', 'Give feedback & request revisions'];
  return (
    <ol aria-label="Classroom learning journey" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step} className="rounded-2xl border border-[#d7dfda] bg-white p-3.5">
          <span className="text-xs font-black tracking-wide text-[#a94716]">{String(index + 1).padStart(2, '0')}</span>
          <p className="mt-1 text-sm font-semibold leading-6">{step}</p>
        </li>
      ))}
    </ol>
  );
}

export default function ClassroomPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [refresh, setRefresh] = useState(0);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [studentData, setStudentData] = useState<Partial<StudentClassroomData>>({});

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [queueCount, setQueueCount] = useState<number | undefined>();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rubricCount, setRubricCount] = useState<number | undefined>();

  const token = session?.access_token ?? '';
  const isStudent = account?.role === 'STUDENT';
  const isTeacher = account?.role === 'LECTURER' || account?.role === 'ADMIN';
  const activeTeam = teams.find(t => t.id === teamId);
  const activeCourse = courses.find(c => c.id === courseId);
  const eligibleCourses = account?.role === 'LECTURER'
    ? courses.filter(c => c.createdById === account.id) : courses;

  useEffect(() => {
    let active = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void withAuthDeadline(() => auth.getSession())
        .then(({ data, error: authError }) => {
          if (!active) return;
          if (authError) setError('Unable to verify your sign-in session. Please sign in again.');
          setSession(data.session);
          setAuthReady(true);
        })
        .catch(() => { if (active) { setError('Could not connect to the authentication service.'); setAuthReady(true); } });
      const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch {
      setError('Authentication is not configured.');
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setAccount(null); setEnrollments([]); setTeams([]); setStudentData({});
      setCourses([]); setChallenges([]); setQueueCount(undefined);
      return;
    }
    let active = true;
    setLoading(true); setError(''); setDetailError('');
    void (async () => {
      try {
        // Role is always loaded from the authenticated backend, never a query parameter.
        const me = await workspaceProfile<Account>(token, refresh > 0);
        if (!active) return;
        setAccount(me);
        if (me.role === 'STUDENT') {
          const [registered, mine] = await Promise.all([
            authenticatedApi<Enrollment[]>('/courses/my-enrollments', token),
            authenticatedApi<Team[]>('/teams/my', token),
          ]);
          if (!active) return;
          setEnrollments(registered);
          setTeams(mine);
          const requested = new URLSearchParams(window.location.search).get('projectId');
          setTeamId(prior => mine.some(t => t.id === requested) ? requested!
            : mine.some(t => t.id === prior) ? prior : mine[0]?.id ?? '');
        } else if (me.role === 'LECTURER' || me.role === 'ADMIN') {
          const [allCourses, queue] = await Promise.all([
            authenticatedApi<Course[]>('/courses', token),
            authenticatedApi<{ id: string }[]>('/assessments/queue', token),
          ]);
          if (!active) return;
          setCourses(allCourses);
          setQueueCount(queue.length);
          const owned = me.role === 'ADMIN' ? allCourses : allCourses.filter(c => c.createdById === me.id);
          setCourseId(prior => owned.some(c => c.id === prior) ? prior : owned[0]?.id ?? '');
        }
      } catch {
        if (active) setError('Classroom data could not be loaded. Retry; progress has not been verified.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, refresh]);

  useEffect(() => {
    if (!token || !isStudent || !teamId) { setStudentData({}); return; }
    let active = true;
    setDetailLoading(true); setDetailError('');
    setStudentData({});
    void Promise.all([
      authenticatedApi<Activity[]>('/projects/' + encodeURIComponent(teamId) + '/activities', token),
      authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token),
      authenticatedApi<Submission[]>('/projects/' + encodeURIComponent(teamId) + '/snapshot-submissions', token),
    ]).then(([activities, evidence, submissions]) => {
      if (!active) return;
      const latest = [...submissions].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt) || b.version - a.version)[0];
      setStudentData({
        activityCount: activities.length,
        completedActivities: activities.filter(a => a.status === 'COMPLETED').length,
        evidenceCount: evidence.filter(e => (e.versions?.length ?? 0) > 0).length,
        submissionStatus: latest?.status ?? null,
      });
    }).catch(() => {
      if (active) setDetailError('Some project data could not be loaded. Refresh before submitting to avoid duplicates.');
    }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [token, isStudent, teamId, refresh]);

  useEffect(() => {
    if (!token || !isTeacher || !courseId) { setChallenges([]); setRubricCount(undefined); return; }
    let active = true;
    setDetailLoading(true); setDetailError(''); setChallenges([]); setRubricCount(undefined);
    void authenticatedApi<Challenge[]>('/courses/' + encodeURIComponent(courseId) + '/challenges', token)
      .then(async list => {
        if (!active) return;
        setChallenges(list);
        const published = list.find(challenge => challenge.status === 'PUBLISHED');
        if (!published) { setRubricCount(0); return; }
        const rubrics = await authenticatedApi<Rubric[]>('/challenges/' + encodeURIComponent(published.id) + '/rubrics', token);
        if (active) setRubricCount(rubrics.filter(r => r.versions?.some(v => v.status === 'PUBLISHED')).length);
      }).catch(() => {
        if (active) setDetailError('Could not load challenges or rubrics from the API.');
      }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [token, isTeacher, courseId, refresh]);

  const next = isStudent
    ? studentClassroomNextAction({
        enrollmentCount: enrollments.length, teamCount: teams.length,
        activityCount: studentData.activityCount, completedActivities: studentData.completedActivities,
        evidenceCount: studentData.evidenceCount, submissionStatus: studentData.submissionStatus,
      }, teamId)
    : teacherClassroomNextAction({
        courseCount: eligibleCourses.length,
        publishedChallenges: activeCourse ? (detailError ? undefined : challenges.filter(c => c.status === 'PUBLISHED').length) : 0,
        publishedRubrics: activeCourse ? rubricCount : 0,
        pendingReviews: queueCount,
      });
  const checking = loading || detailLoading || !!error || !!detailError;

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    setSession(null);
  }

  return (
    <div className="uii-workspace min-h-screen bg-[#faf8f1] text-[#173445]">
      <WorkspaceNav title="Design Thinking Classroom" role={account?.role}
        guest={authReady && !session} onSignOut={account ? () => void signOut() : undefined}/>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-6">
        <div>
          <p className="text-xs font-black tracking-[.15em] text-[#a94716]">UII DESIGN THINKING HUB · CLASSROOM</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your Classroom</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#4a6062]">
            One clear next step. All progress comes from verified classroom data; unsaved work is never marked complete.
          </p>
          <Link href="/pilot" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#0e6857] underline underline-offset-4">
            Pilot guide for students and lecturers <ArrowRight size={16} aria-hidden="true"/>
          </Link>
        </div>

        {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          {error} <button type="button" onClick={() => setRefresh(n => n + 1)} className="ml-2 font-bold underline">Try again</button>
        </div>}
        {(!authReady || checking && !account) && <WorkspaceLoading label="Checking account and classroom status…"/>}
        {authReady && !session && <section className={card}>
          <h2 className="text-xl font-black">Sign in to begin</h2>
          <p className="mt-2 mb-4 text-sm">You need a verified UII account to view your activities, team, and submissions.</p>
          <ActionLink href="/learn">Sign in to UII</ActionLink>
        </section>}

        {account && (isTeacher || isStudent) && <>
          <section className="rounded-[24px] border border-[#173445] bg-[#173445] p-5 text-white shadow-sm sm:p-7" aria-label="Your next step">
            <p className="text-xs font-bold tracking-widest text-[#b4d9cd]">{checking ? 'UPDATING' : next.stage}</p>
            <h2 className="mt-2 text-2xl font-black">{checking ? 'Verifying progress…' : next.title}</h2>
            <p className="mt-2 mb-5 max-w-2xl text-sm leading-7 text-[#e0edec]">
              {checking ? 'The system is checking actual records before suggesting the next step.' : next.detail}
            </p>
            {!checking && <Link href={next.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f8d0ad] px-5 py-3 text-sm font-bold text-[#173445] hover:bg-white">
              Continue with this step <ArrowRight size={17} aria-hidden="true"/>
            </Link>}
          </section>
          <StepGuide student={isStudent}/>
          {isStudent && <section className="rounded-[22px] border border-[#b9d9cd] bg-[#f2f8f2] p-5 sm:p-6" aria-label="Today's featured activity">
            <p className="text-xs font-black uppercase tracking-[.15em] text-[#8b4d25]">CHAPTER 10 · FIRST FINDINGS</p>
            <h2 className="mt-2 text-xl font-black">Start with two real-world problems</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#465f62]">
              Activity 2 (slides 64–65): describe two problems, supporting sources, affected people,
              their current responses, resources, and value. Prepare one summary slide and a two-minute presentation.
            </p>
            <Link href={teamId ? '/classroom/first-findings?projectId=' + encodeURIComponent(teamId) : '/classroom/first-findings'}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white">
              Open Activity 2 <ArrowRight size={16} aria-hidden="true"/>
            </Link>
          </section>}
          {isTeacher && courseId && !loading && !detailLoading && <TeacherClassroomBoard
            token={token} courseId={courseId} challenges={challenges}/>}

          <section className={card} aria-label="Choose your workspace">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black">{isStudent ? 'Your team's project' : 'Your courses'}</h2>
              <button type="button" onClick={() => setRefresh(n => n + 1)}
                className={secondaryStyle}><RefreshCcw size={16} aria-hidden="true"/> Refresh status</button>
            </div>
            {isStudent && teams.length > 0 && <div className="mt-3">
              <label htmlFor="pilot-project" className="block text-sm font-bold">Select project</label>
              <select id="pilot-project" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={teamId} onChange={event => setTeamId(event.target.value)}>
                {teams.map(t => <option value={t.id} key={t.id}>{t.title}</option>)}
              </select>
            </div>}
            {isTeacher && eligibleCourses.length > 0 && <div className="mt-3">
              <label htmlFor="pilot-course" className="block text-sm font-bold">Select course</label>
              <select id="pilot-course" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={courseId} onChange={event => setCourseId(event.target.value)}>
                {eligibleCourses.map(c => <option value={c.id} key={c.id}>{c.title}</option>)}
              </select>
            </div>}
            <p className="mt-3 text-sm text-[#506468]">
              {isStudent
                ? activeTeam ? 'Current stage: ' + activeTeam.currentStage : 'No project team is linked to your account.'
                : activeCourse ? 'Course status: ' + activeCourse.status : 'No courses are assigned to your lecturer account.'}
            </p>
          </section>
          {detailError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{detailError}</p>}
          <section className={card}>
            <h2 className="mb-4 text-lg font-black">Your learning journey</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/studio" className="rounded-xl border p-4 hover:bg-[#f1f6f2]">
                <FolderKanban aria-hidden="true" size={22}/>
                <span className="mt-2 block font-bold">1. Project practice</span>
                <span className="mt-1 block text-xs leading-5 text-[#506468]">Challenges, teams, and activities</span>
              </Link>
              <Link href={activeTeam ? '/evidence?projectId=' + encodeURIComponent(activeTeam.id) : '/evidence'}
                className="rounded-xl border p-4 hover:bg-[#f1f6f2]">
                <FileText aria-hidden="true" size={22}/>
                <span className="mt-2 block font-bold">2. Evidence & submissions</span>
                <span className="mt-1 block text-xs leading-5 text-[#506468]">Save versions and submit work</span>
              </Link>
              <Link href={isTeacher ? '/review' : '/notifications'} className="rounded-xl border p-4 hover:bg-[#f1f6f2]">
                {isTeacher ? <ClipboardCheck aria-hidden="true" size={22}/> : <CheckCircle2 aria-hidden="true" size={22}/>}
                <span className="mt-2 block font-bold">3. Feedback & improvement</span>
                <span className="mt-1 block text-xs leading-5 text-[#506468]">See feedback and take the next step</span>
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <ActionLink href="/learn" secondary><BookOpen size={16} aria-hidden="true"/> Courses</ActionLink>
              {isTeacher && <ActionLink href="/review" secondary><ShieldCheck size={16} aria-hidden="true"/> Assessment rubric</ActionLink>}
            </div>
          </section>
          <p className="text-xs leading-6 text-[#607579]">
            Only authorized users may view team data and evidence. Do not upload identifying interview information without consent. Revision and approval states come from the backend.
          </p>
        </>}
        {account && !isStudent && !isTeacher && <section className={card}>
          <p>Mentors can use project spaces according to their assigned permissions.</p>
          <div className="mt-4"><ActionLink href="/studio">Open Studio</ActionLink></div>
        </section>}
        {account && <div className="text-xs text-[#647579]">Account: {account.role === 'STUDENT' ? 'Student' : account.role === 'LECTURER' ? 'Lecturer' : account.role === 'ADMIN' ? 'Administrator' : 'Mentor'} · Dữ liệu chỉ hiển thị sau xác minh đăng nhập.</div>}
      </main>
    </div>
  );
}
