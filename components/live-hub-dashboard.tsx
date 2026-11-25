"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, Bell, ClipboardCheck, FolderKanban, GraduationCap, Lightbulb, Layers3, Users, Sparkles, RotateCcw } from "lucide-react";
import { WorkspaceLoading } from "@/components/workspace-loading";
import { WorkspaceNav } from "@/components/workspace-nav";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { authenticatedApi as api, workspaceProfile, WorkspaceApiError } from "@/lib/authenticated-api";
import { withAuthDeadline } from "@/lib/auth-timeout";

type Role = "STUDENT" | "LECTURER" | "ADMIN" | "MENTOR";
type Account = { id: string; fullName: string; email: string; role: Role };
type Course = {
  id: string;
  title: string;
  description?: string | null;
  level?: string | null;
  status: string;
  createdById?: string;
  _count?: { lessons?: number; enrollments?: number };
};
type Enrollment = { id: string; courseId: string; course: Course; progress?: Progress & { nextLesson: {id: string; title: string} | null } };
type Project = {
  id: string;
  title: string;
  status: string;
  currentStage: string;
  challengeId?: string | null;
  course?: { title: string };
  _count?: { evidence?: number; feedback?: number };
};
type Notification = {
  id: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
type Submission = { id: string; project: { title: string } };
type Progress = {
  totalLessons: number;
  completedLessons: number;
  percent: number;
};
type Milestone = { id: string; title: string; dueAt: string | null };
type DashboardData = {
  milestones: Milestone[] | null;
  courses: Course[] | null;
  projects: Project[] | null;
  notifications: Notification[] | null;
  enrollments: Enrollment[] | null;
  queue: Submission[] | null;
  progress: Progress | null;
};
const emptyData: DashboardData = {
  milestones: null,
  courses: null,
  projects: null,
  notifications: null,
  enrollments: null,
  queue: null,
  progress: null,
};
function valueOf<T>(item: PromiseSettledResult<T>): T | null {
  return item.status === "fulfilled" ? item.value : null;
}
function roleName(role: Role) {
  return {
    STUDENT: "Student",
    LECTURER: "Lecturer",
    ADMIN: "Administrator",
    MENTOR: "Mentor",
  }[role];
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.045)] sm:p-6">
      <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
function Action({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#963b08]"
    >
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
export function LiveHubDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    try {
      const client = getSupabaseBrowserClient();
      void withAuthDeadline(() => client.auth.getSession())
        .then(({ data: result, error: authError }) => {
          if (!alive) return;
          if (authError) setError(authError.message);
          setSession(result.session);
          setAuthReady(true);
        })
        .catch((err: unknown) => {
          if (alive) {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to read the sign-in session.",
            );
            setAuthReady(true);
          }
        });
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, next) => {
        if (alive) setSession(next);
      });
      return () => {
        alive = false;
        subscription.unsubscribe();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication configuration is not ready.",
      );
      setAuthReady(true);
    }
  }, []);

  const loadDashboard = useCallback(
    async (token: string, alive: () => boolean, refresh: boolean) => {
      setLoading(true);
      setError("");
      setPartialError("");
      try {
        // Roles come from the trusted API; no client-selectable role switch.
        const me = await workspaceProfile<Account>(token, refresh);
        if (!alive()) return;
        setAccount(me);
        const reviewer = me.role === "ADMIN" || me.role === "LECTURER";
        const [
          coursesResult,
          projectsResult,
          notificationsResult,
          enrollmentsResult,
          queueResult,
          milestonesResult,
        ] = await Promise.allSettled([
          api<Course[]>("/courses", token),
          api<Project[]>("/projects", token),
          api<Notification[]>("/notifications", token),
          me.role === "STUDENT"
            ? api<Enrollment[]>("/courses/my-enrollments", token)
            : Promise.resolve(null),
          reviewer
            ? api<Submission[]>("/assessments/queue", token)
            : Promise.resolve(null),
          me.role === "STUDENT" ? api<Milestone[]>("/teams/my/milestones", token) : Promise.resolve(null),
        ]);
        if (!alive()) return;
        const courses = valueOf(coursesResult),
          projects = valueOf(projectsResult);
        const notifications = valueOf(notificationsResult);
        const enrollments = valueOf(enrollmentsResult),
          queue = valueOf(queueResult);
        const failed = [
          coursesResult,
          projectsResult,
          notificationsResult,
          enrollmentsResult,
          queueResult,
          milestonesResult,
        ].filter((result) => result.status === "rejected").length;
        const mostRecent = enrollments?.find(item => item.progress?.nextLesson) ?? enrollments?.[0];
        const [legacyProgress, legacyMilestones] = await Promise.allSettled([
          mostRecent && !mostRecent.progress
            ? api<Progress>("/courses/" + encodeURIComponent(mostRecent.courseId) + "/my-progress", token)
            : Promise.resolve(null),
          milestonesResult.status === "rejected" && milestonesResult.reason instanceof WorkspaceApiError && milestonesResult.reason.status === 404 && projects
            ? Promise.all(projects.filter(project => project.challengeId).map(project =>
                api<{ challenge?: { milestones: Milestone[] } }>("/teams/" + encodeURIComponent(project.id), token),
              )).then(teams => [...new Map(teams.flatMap(team => team.challenge?.milestones ?? [])
                .filter(item => item.dueAt).map(item => [item.id, item])).values()]
                .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!)))
            : Promise.resolve(null),
        ]);
        if (!alive()) return;
        const milestones = valueOf(milestonesResult) ?? valueOf(legacyMilestones);
        const failureCount = failed - (milestonesResult.status === "rejected" && milestones !== null ? 1 : 0)
          + (legacyProgress.status === "rejected" ? 1 : 0);
        setData({
          courses,
          projects,
          notifications,
          enrollments,
          queue,
          progress: mostRecent?.progress ?? valueOf(legacyProgress),
          milestones,
        });
        if (failureCount)
          setPartialError(
            "Could not load " +
              failureCount +
              " data sources. Some metrics are unavailable; try refreshing.",
          );

      } catch (err) {
        if (alive()) {
          setAccount(null);
          setData(emptyData);
          setError(
            err instanceof Error ? err.message : "Could not connect to the server.",
          );
        }
      } finally {
        if (alive()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const token = session?.access_token;
    if (!token) {
      setAccount(null);
      setData(emptyData);
      setPartialError("");
      return;
    }
    let alive = true;
    void loadDashboard(token, () => alive, reload > 0);
    return () => {
      alive = false;
    };
  }, [session?.access_token, reload, loadDashboard]);

  async function signOut() {
    try {
      const { error: authError } =
        await getSupabaseBrowserClient().auth.signOut();
      if (authError) throw authError;
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.");
    }
  }

  const student = account?.role === "STUDENT";
  const admin = account?.role === "ADMIN";
  const lecturer = account?.role === "LECTURER";
  const ownedCourses = lecturer
    ? data.courses?.filter((course) => course.createdById === account?.id)
    : data.courses;
  const nextEnrollment = data.enrollments?.find(item => item.progress?.nextLesson) ?? data.enrollments?.[0];
  const nextCourse = nextEnrollment?.course;
  const title = student
    ? "My learning"
    : admin
      ? "Platform administration"
      : lecturer
        ? "Teaching workspace"
        : "Dashboard";
  return (
    <div className="uii-workspace min-h-screen bg-[#faf8f1] text-[#132a35]">
      <WorkspaceNav
        variant="classic"
        title={title}
        guest={authReady && !session}
        role={account?.role}
        onSignOut={account ? () => void signOut() : undefined}
      />
      <main
        id="main-content" tabIndex={-1}
        className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}{" "}
            <button
              onClick={() => setReload((n) => n + 1)}
              className="min-h-11 px-3 font-bold underline"
            >
              Try again
            </button>
          </div>
        )}
        {partialError && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"
          >
            {partialError}{" "}
            <button
              onClick={() => setReload((n) => n + 1)}
              className="min-h-11 px-3 font-bold underline"
            >
              Refresh
            </button>
          </div>
        )}
        {(!authReady || loading || (session && !account && !error)) && (
          <WorkspaceLoading label={!authReady ? "Checking your sign-in session…" : !account ? "Verifying your account…" : "Loading your learning workspace…"}/>
        )}
        {authReady && !session && (
          <Panel title="Welcome">
            <p className="mb-4">
              Sign in to see your courses, projects, and feedback.
            </p>
            <Action href="/learn">Sign in</Action>
          </Panel>
        )}
        {session && !loading && !account && error && (
          <Panel title="Profile not available">
            <p className="mb-4">
              You are signed in. Reload to verify your access
              permissions.
            </p>
            <button
              className="min-h-11 rounded-xl border px-4"
              onClick={() => setReload((n) => n + 1)}
            >
              Refresh profile
            </button>
          </Panel>
        )}
        {account && !loading && (
          <>
            <section aria-label="Welcome and primary action" className="relative overflow-hidden rounded-[30px] bg-[#173445] p-6 text-white shadow-[0_20px_70px_rgba(7,29,67,0.14)] sm:p-9">
              <div className="pointer-events-none absolute -right-14 -top-24 h-80 w-80 rounded-full border-[42px] border-[#a6e9ee]/25" aria-hidden="true" />
              <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Hello, {account.fullName}</p>
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#ffd1aa]/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#ffbe90]"><Sparkles size={14} aria-hidden="true"/> {roleName(account.role)} · Learning workspace</p>
                  <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-[38px]">{student ? <>Today, <span className="text-[#ffb47f]">what should you do next?</span></> : <>Hello {account.fullName.split(" ").slice(-1)[0] || "there"}, <span className="text-[#ff9b59]">keep making a difference.</span></>}</h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">{student ? "Start in Classroom: see your current task, work with your team, save deliverables, and receive feedback. Other tools are available when needed." : lecturer ? "Guide ideas, support students, and offer actionable feedback." : "Manage learning activities, support lecturers, and grow the innovation community."}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={student ? "/classroom" : lecturer ? "/review" : "/admin"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-5 py-3 text-sm font-bold text-white hover:bg-[#963b08]">{student ? "See today's task" : lecturer ? (data.queue?.length ? "Review submissions" : "View teaching tasks") : "Manage users"} <ArrowRight size={17} aria-hidden="true"/></Link>
                    {!student && <><Link href="/learn" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"><BookOpen size={17} aria-hidden="true"/> Courses</Link>
                    <Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"><ClipboardCheck size={17} aria-hidden="true"/> Design Thinking Classroom</Link></>}
                  </div>
                </div>
                <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold">{roleName(account.role)}</span>
              </div>
            </section>
            <section aria-labelledby="classic-overview-title">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ad4007]">YOUR WORKSPACE</p><h2 id="classic-overview-title" className="mt-1 text-2xl font-extrabold">Today's dashboard</h2></div>
                <button aria-label="Refresh dashboard data" disabled={loading} className="min-h-11 rounded-xl border bg-white px-4 font-semibold hover:border-orange-300" onClick={() => setReload((n) => n + 1)}>Refresh</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: student ? "Enrolled courses" : "Available courses", value: student ? data.enrollments?.length : data.courses?.length, icon: BookOpen, tint: "bg-blue-50 text-blue-700" },
                  { label: student ? "My projects" : "Accessible projects", value: data.projects?.length, icon: FolderKanban, tint: "bg-violet-50 text-violet-700" },
                  { label: student ? "Course progress" : "Pending reviews", value: student ? (data.progress ? data.progress.percent + "%" : "—") : (data.queue?.length ?? "—"), icon: student ? GraduationCap : ClipboardCheck, tint: "bg-orange-50 text-orange-700" },
                  { label: "Unread notifications", value: data.notifications?.filter(note => !note.readAt).length, icon: Bell, tint: "bg-emerald-50 text-emerald-700" },
                ].map(({ label, value, icon: Icon, tint }) => (
                  <div key={label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.045)]">
                    <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p><span className={"grid size-9 shrink-0 place-items-center rounded-xl " + tint}><Icon size={18} aria-hidden="true"/></span></div>
                    <p className="mt-3 text-3xl font-extrabold text-[#0a2044]">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </section>
            <section aria-labelledby="classic-modules-title">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ad4007]">LEARN · CREATE · ITERATE</p>
              <h2 id="classic-modules-title" className="mb-4 mt-1 text-2xl font-extrabold">{student ? "More tools when needed" : "Explore workspaces"}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { href: "/learn", title: "Courses", subtitle: "Learn methods, practise skills, and save progress.", icon: GraduationCap, tint: "bg-blue-50 text-blue-700", number: "01" },
                  { href: "/studio", title: "Design Studio", subtitle: "Complete challenges with your team.", icon: Layers3, tint: "bg-violet-50 text-violet-700", number: "02" },
                  { href: "/evidence", title: "Evidence & iteration", subtitle: "Save evidence and submission versions.", icon: BookOpen, tint: "bg-orange-50 text-orange-700", number: "03" },
                  { href: account.role === "STUDENT" ? "/notifications" : "/review", title: student ? "Feedback" : "Review & Feedback", subtitle: "Learn from feedback and improve deliverables.", icon: RotateCcw, tint: "bg-emerald-50 text-emerald-700", number: "04" },
                ].map(({ href, title, subtitle, icon: Icon, tint, number }) => (
                  <Link key={href} href={href} className="group flex min-h-[176px] flex-col justify-between rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_28px_rgba(20,42,78,0.045)] transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg">
                    <div className="flex items-center justify-between"><span className={"grid size-11 place-items-center rounded-xl " + tint}><Icon size={23} aria-hidden="true"/></span><span className="text-xl font-black text-slate-500">{number}</span></div>
                    <div><h3 className="text-base font-extrabold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p></div>
                  </Link>
                ))}
              </div>
            </section>
            {student && (
              <>
                <Panel
                  title={
                    nextCourse ? "Continue learning" : "Start learning in three steps"
                  }
                >
                  <p className="mb-4">
                    {nextCourse
                      ? nextCourse.title
                      : "Choose a course → Enroll → Open your first lesson. Then apply it with your team in Projects."}
                  </p>
                  {data.progress && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm">
                        {data.progress.completedLessons}/
                        {data.progress.totalLessons} lessons completed ·{" "}
                        {data.progress.percent}%
                      </p>
                      <div
                        role="progressbar"
                        aria-label="Course progress"
                        aria-valuenow={data.progress.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                      >
                        <div
                          className="h-full bg-blue-700"
                          style={{ width: data.progress.percent + "%" }}
                        />
                      </div>
                    </div>
                  )}
                  <Action
                    href={
                      nextCourse
                        ? "/learn?course=" + encodeURIComponent(nextCourse.id) + (nextEnrollment?.progress?.nextLesson ? '&lesson=' + encodeURIComponent(nextEnrollment.progress.nextLesson.id) : '')
                        : "/learn"
                    }
                  >
                    {nextEnrollment?.progress?.nextLesson ? "Continue learning" : nextCourse ? "View course" : "Browse courses"}
                  </Action>
                </Panel>
                <Panel title="My courses">
                  {data.enrollments === null ? (
                    <p>Courses could not be loaded. Please try again.</p>
                  ) : data.enrollments.length === 0 ? (
                    <p>
                      You have not enrolled in any courses. Select Browse courses to
                      get started.
                    </p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {data.enrollments.map((item) => (
                        <Link
                          key={item.id}
                          href={
                            "/learn?course=" + encodeURIComponent(item.courseId)
                          }
                          className="rounded-xl border p-4 hover:border-blue-600"
                        >
                          <BookOpen
                            aria-hidden="true"
                            className="mb-3 text-blue-700"
                          />
                          <h3 className="font-bold">{item.course.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.progress ? `${item.progress.completedLessons}/${item.progress.totalLessons} lessons · ${item.progress.percent}%` : 'Progress unavailable'} →
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </Panel>
              </>
            )}
            {lecturer && (
              <Panel title="Submissions awaiting review">
                {data.queue === null ? (
                  <p>Review queue could not be loaded. Try again.</p>
                ) : data.queue.length ? (
                  <>
                    <p className="mb-4">
                      {data.queue.length} submissions are awaiting your review.
                    </p>
                    {data.queue.slice(0, 3).map((item) => (
                      <p key={item.id} className="mb-3 font-semibold">
                        {item.project.title}
                      </p>
                    ))}
                    <Action href="/review">Review submissions</Action>
                  </>
                ) : (
                  <>
                    <p className="mb-4">
                      No submissions are pending. You can prepare content
                      for your next class.
                    </p>
                    <Action href="/learn">Manage courses</Action>
                  </>
                )}
              </Panel>
            )}
            {admin && (
              <Panel title="Manage accounts & permissions">
                <p className="mb-4">
                  View accounts and roles verified by the system.
                </p>
                <Action href="/admin">Open account management</Action>
                <p className="mt-4 text-sm text-slate-600">
                  Operational metrics and permission history are not yet
                  available from verified sources. This dashboard does not infer system health.
                </p>
              </Panel>
            )}
            {(lecturer || admin) && (
              <Panel
                title={lecturer ? "Courses I manage" : "Course overview"}
              >
                <p className="mb-4">
                  {ownedCourses === null
                    ? "Courses could not be loaded."
                    : ownedCourses?.length +
                      " accessible courses."}
                </p>
                <ul className="mb-4 space-y-3">
                  {ownedCourses?.slice(0, 5).map((course) => (
                    <li key={course.id}>
                      <Link
                        className="inline-flex min-h-11 items-center font-semibold underline"
                        href={"/learn?course=" + encodeURIComponent(course.id)}
                      >
                        {course.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Action href="/learn">Create or edit courses</Action>
              </Panel>
            )}
            {student && (
              <Panel title="Project milestones & deadlines">
                {data.milestones === null ? (
                  <p>
                    Deadlines could not be loaded. Open Projects to review team milestones.
                  </p>
                ) : data.milestones.length === 0 ? (
                  <p>Your team has no scheduled milestones yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.milestones.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap justify-between gap-2 rounded-xl border p-3"
                      >
                        <span className="font-semibold">{m.title}</span>
                        <time dateTime={m.dueAt!}>
                          {new Date(m.dueAt!).toLocaleDateString("vi-VN")}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel
                title={
                  student ? "My projects" : "Managed projects"
                }
              >
                {data.projects === null ? (
                  <p>Projects could not be loaded.</p>
                ) : data.projects.length === 0 ? (
                  <p className="mb-4">
                    No projects yet. Open Projects for challenges and team
                    gia.
                  </p>
                ) : (
                  data.projects.slice(0, 4).map((project) => (
                    <div
                      key={project.id}
                      className="mb-4 rounded-xl border p-4"
                    >
                      <h3 className="font-bold">{project.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {(
                          {
                            EMPATHIZE: "Empathize",
                            DEFINE: "Define",
                            IDEATE: "Ideate",
                            PROTOTYPE: "Prototype",
                            TEST: "Test",
                          } as Record<string, string>
                        )[project.currentStage] ?? "In progress"}
                      </p>
                    </div>
                  ))
                )}
                <Action href="/studio">
                  {lecturer ? "Manage challenges and teams" : "Open projects and teams"}
                </Action>
              </Panel>
              <Panel title="Feedback & reminders">
                {data.notifications === null ? (
                  <p>Notifications could not be loaded.</p>
                ) : data.notifications.length === 0 ? (
                  <p className="mb-4">
                    No notifications yet. Feedback and reminders will
                    appear here.
                  </p>
                ) : (
                  <ul className="mb-4 space-y-3">
                    {data.notifications.slice(0, 4).map((note) => (
                      <li key={note.id} className="rounded-xl border p-3">
                        <p className="break-words text-sm">{note.message}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {note.readAt ? "Read" : "Unread"} ·{" "}
                          {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <Action href="/notifications">View notifications</Action>
              </Panel>
            </div>
            <section aria-labelledby="classic-modes-title" className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">DESIGN THINKING IN ACTION</p>
              <h2 id="classic-modes-title" className="mt-1 text-2xl font-extrabold">Five stages. Keep iterating.</h2>
              <p className="mt-2 text-sm text-slate-600">Revisit any stage whenever you learn something new.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { name: "Empathize", vi: "Understand people", icon: Users, tone: "bg-blue-50 text-blue-700" },
                  { name: "Define", vi: "Define", icon: GraduationCap, tone: "bg-violet-50 text-violet-700" },
                  { name: "Ideate", vi: "Generate diverse ideas", icon: Lightbulb, tone: "bg-amber-50 text-amber-800" },
                  { name: "Prototype", vi: "Make ideas tangible", icon: Layers3, tone: "bg-emerald-50 text-emerald-700" },
                  { name: "Test", vi: "Validate assumptions", icon: RotateCcw, tone: "bg-rose-50 text-rose-700" },
                ].map(({ name, vi, icon: Icon, tone }) => (
                  <Link key={name} href="/studio" className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#b94708] hover:bg-slate-50"><span className={"grid size-10 place-items-center rounded-xl " + tone}><Icon size={20} aria-hidden="true"/></span><h3 className="mt-3 font-bold">{name}</h3><p className="mt-1 text-sm text-slate-600">{vi}</p></Link>
                ))}
              </div>
            </section>
            <details className="rounded-2xl border bg-white p-5">
              <summary className="min-h-11 cursor-pointer font-bold">
                Need help with your next step?
              </summary>
              <p className="mt-3 text-sm leading-7">
                Courses teach methods. Projects let you practise with
                your team. Save evidence, submit work, and review feedback. You
                can revisit any Design Thinking activity when you discover
                something new.
              </p>
              <Link
                href="/evidence"
                className="inline-flex min-h-11 items-center font-semibold underline"
              >
                Open Evidence & Feedback
              </Link>
            </details>
          </>
        )}
        <footer className="border-t py-4 text-xs text-slate-600">
          UII Design Thinking Hub · Pilot environment
        </footer>
      </main>
    </div>
  );
}
