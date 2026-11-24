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
    STUDENT: "Sinh viên",
    LECTURER: "Giảng viên",
    ADMIN: "Quản trị viên",
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
                : "Không đọc được phiên đăng nhập.",
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
        err instanceof Error ? err.message : "Cấu hình xác thực chưa sẵn sàng.",
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
            "Không thể tải " +
              failureCount +
              " nguồn dữ liệu. Một số chỉ số chưa sẵn sàng; hãy thử tải lại.",
          );

      } catch (err) {
        if (alive()) {
          setAccount(null);
          setData(emptyData);
          setError(
            err instanceof Error ? err.message : "Không kết nối được máy chủ.",
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
      setError(err instanceof Error ? err.message : "Không đăng xuất được.");
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
    ? "Việc học của tôi"
    : admin
      ? "Quản trị nền tảng"
      : lecturer
        ? "Không gian giảng dạy"
        : "Tổng quan";
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
              Thử lại
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
              Tải lại
            </button>
          </div>
        )}
        {(!authReady || loading || (session && !account && !error)) && (
          <WorkspaceLoading label={!authReady ? "Đang kiểm tra phiên đăng nhập…" : !account ? "Đang xác minh tài khoản…" : "Đang tải không gian học tập…"}/>
        )}
        {authReady && !session && (
          <Panel title="Chào mừng bạn">
            <p className="mb-4">
              Đăng nhập để xem khóa học, dự án và phản hồi của bạn.
            </p>
            <Action href="/learn">Đăng nhập</Action>
          </Panel>
        )}
        {session && !loading && !account && error && (
          <Panel title="Chưa tải được hồ sơ">
            <p className="mb-4">
              Phiên đăng nhập đã được nhận. Hãy thử tải lại để xác minh quyền
              truy cập.
            </p>
            <button
              className="min-h-11 rounded-xl border px-4"
              onClick={() => setReload((n) => n + 1)}
            >
              Tải lại hồ sơ
            </button>
          </Panel>
        )}
        {account && !loading && (
          <>
            <section aria-label="Chào mừng và hành động chính" className="relative overflow-hidden rounded-[30px] bg-[#173445] p-6 text-white shadow-[0_20px_70px_rgba(7,29,67,0.14)] sm:p-9">
              <div className="pointer-events-none absolute -right-14 -top-24 h-80 w-80 rounded-full border-[42px] border-[#a6e9ee]/25" aria-hidden="true" />
              <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Xin chào, {account.fullName}</p>
                  <p className="inline-flex items-center gap-2 rounded-full border border-[#ffd1aa]/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-[#ffbe90]"><Sparkles size={14} aria-hidden="true"/> {roleName(account.role)} · Không gian học tập</p>
                  <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-[38px]">Chào {account.fullName.split(" ").slice(-1)[0] || "bạn"}, <span className="text-[#ff9b59]">tiếp tục tạo khác biệt.</span></h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">{student ? "Học hỏi, khám phá, thực hành và phát triển giải pháp hữu ích cho cộng đồng." : lecturer ? "Dẫn dắt những ý tưởng, đồng hành cùng sinh viên và đưa ra phản hồi giá trị." : "Quản lý hoạt động học tập, hỗ trợ giảng viên và phát triển cộng đồng đổi mới."}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={student ? (nextCourse ? "/learn?course=" + encodeURIComponent(nextCourse.id) + (nextEnrollment?.progress?.nextLesson ? "&lesson=" + encodeURIComponent(nextEnrollment.progress.nextLesson.id) : "") : "/learn") : lecturer ? "/review" : "/admin"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-5 py-3 text-sm font-bold text-white hover:bg-[#963b08]">{student ? nextCourse ? "Tiếp tục khóa học" : "Khám phá khóa học" : lecturer ? (data.queue?.length ? "Đánh giá bài nộp" : "Xem công việc giảng dạy") : "Quản trị người dùng"} <ArrowRight size={17} aria-hidden="true"/></Link>
                    <Link href="/learn" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"><BookOpen size={17} aria-hidden="true"/> Khóa học</Link>
                    <Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"><ClipboardCheck size={17} aria-hidden="true"/> Buổi học Design Thinking</Link>
                  </div>
                </div>
                <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold">{roleName(account.role)}</span>
              </div>
            </section>
            <section aria-labelledby="classic-overview-title">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ad4007]">YOUR WORKSPACE</p><h2 id="classic-overview-title" className="mt-1 text-2xl font-extrabold">Tổng quan hôm nay</h2></div>
                <button aria-label="Làm mới dữ liệu" disabled={loading} className="min-h-11 rounded-xl border bg-white px-4 font-semibold hover:border-orange-300" onClick={() => setReload((n) => n + 1)}>Làm mới</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: student ? "Khóa học đã tham gia" : "Khóa học hiển thị", value: student ? data.enrollments?.length : data.courses?.length, icon: BookOpen, tint: "bg-blue-50 text-blue-700" },
                  { label: student ? "Dự án của tôi" : "Dự án thuộc phạm vi", value: data.projects?.length, icon: FolderKanban, tint: "bg-violet-50 text-violet-700" },
                  { label: student ? "Tiến độ khóa học" : "Bài chờ đánh giá", value: student ? (data.progress ? data.progress.percent + "%" : "—") : (data.queue?.length ?? "—"), icon: student ? GraduationCap : ClipboardCheck, tint: "bg-orange-50 text-orange-700" },
                  { label: "Thông báo chưa đọc", value: data.notifications?.filter(note => !note.readAt).length, icon: Bell, tint: "bg-emerald-50 text-emerald-700" },
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
              <h2 id="classic-modules-title" className="mb-4 mt-1 text-2xl font-extrabold">Khám phá không gian học tập</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { href: "/learn", title: "Khóa học", subtitle: "Học phương pháp, luyện kỹ năng, lưu tiến độ.", icon: GraduationCap, tint: "bg-blue-50 text-blue-700", number: "01" },
                  { href: "/studio", title: "Design Studio", subtitle: "Thực hiện thử thách cùng đội nhóm.", icon: Layers3, tint: "bg-violet-50 text-violet-700", number: "02" },
                  { href: "/evidence", title: "Minh chứng & cải tiến", subtitle: "Lưu minh chứng và phiên bản bài nộp.", icon: BookOpen, tint: "bg-orange-50 text-orange-700", number: "03" },
                  { href: account.role === "STUDENT" ? "/notifications" : "/review", title: student ? "Phản hồi" : "Đánh giá & phản hồi", subtitle: "Học từ nhận xét và cải tiến sản phẩm.", icon: RotateCcw, tint: "bg-emerald-50 text-emerald-700", number: "04" },
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
                    nextCourse ? "Tiếp tục học" : "Bắt đầu học trong 3 bước"
                  }
                >
                  <p className="mb-4">
                    {nextCourse
                      ? nextCourse.title
                      : "Chọn khóa học → Ghi danh → Mở bài học đầu tiên. Sau đó áp dụng cùng nhóm trong Dự án."}
                  </p>
                  {data.progress && (
                    <div className="mb-4">
                      <p className="mb-2 text-sm">
                        {data.progress.completedLessons}/
                        {data.progress.totalLessons} bài hoàn thành ·{" "}
                        {data.progress.percent}%
                      </p>
                      <div
                        role="progressbar"
                        aria-label="Tiến độ khóa học"
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
                    {nextEnrollment?.progress?.nextLesson ? "Tiếp tục học" : nextCourse ? "Xem khóa học" : "Khám phá khóa học"}
                  </Action>
                </Panel>
                <Panel title="Khóa học của tôi">
                  {data.enrollments === null ? (
                    <p>Chưa tải được khóa học. Hãy thử tải lại.</p>
                  ) : data.enrollments.length === 0 ? (
                    <p>
                      Bạn chưa ghi danh khóa học nào. Chọn Khám phá khóa học để
                      bắt đầu.
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
                            {item.progress ? `${item.progress.completedLessons}/${item.progress.totalLessons} bài · ${item.progress.percent}%` : 'Tiến độ chưa có dữ liệu'} →
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </Panel>
              </>
            )}
            {lecturer && (
              <Panel title="Bài nộp cần phản hồi">
                {data.queue === null ? (
                  <p>Chưa tải được hàng chờ. Hãy thử tải lại.</p>
                ) : data.queue.length ? (
                  <>
                    <p className="mb-4">
                      {data.queue.length} bài nộp đang chờ bạn đánh giá.
                    </p>
                    {data.queue.slice(0, 3).map((item) => (
                      <p key={item.id} className="mb-3 font-semibold">
                        {item.project.title}
                      </p>
                    ))}
                    <Action href="/review">Đánh giá bài nộp</Action>
                  </>
                ) : (
                  <>
                    <p className="mb-4">
                      Không có bài chờ đánh giá. Bạn có thể chuẩn bị nội dung
                      cho buổi học tiếp theo.
                    </p>
                    <Action href="/learn">Quản lý khóa học</Action>
                  </>
                )}
              </Panel>
            )}
            {admin && (
              <Panel title="Quản trị người dùng và quyền truy cập">
                <p className="mb-4">
                  Xem danh sách tài khoản và vai trò đã được hệ thống xác minh.
                </p>
                <Action href="/admin">Mở quản trị người dùng</Action>
                <p className="mt-4 text-sm text-slate-600">
                  Chỉ số vận hành và lịch sử thay đổi quyền chưa có nguồn báo
                  cáo. Trang này không suy đoán tình trạng hệ thống.
                </p>
              </Panel>
            )}
            {(lecturer || admin) && (
              <Panel
                title={lecturer ? "Khóa học tôi quản lý" : "Tổng quan khóa học"}
              >
                <p className="mb-4">
                  {ownedCourses === null
                    ? "Chưa tải được khóa học."
                    : ownedCourses?.length +
                      " khóa học trong phạm vi truy cập."}
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
                <Action href="/learn">Tạo hoặc chỉnh sửa khóa học</Action>
              </Panel>
            )}
            {student && (
              <Panel title="Mốc dự án và hạn nộp">
                {data.milestones === null ? (
                  <p>
                    Chưa tải được hạn nộp. Xem Dự án để kiểm tra mốc của nhóm.
                  </p>
                ) : data.milestones.length === 0 ? (
                  <p>Nhóm của bạn chưa có mốc được đặt ngày.</p>
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
                  student ? "Dự án của tôi" : "Dự án trong phạm vi quản lý"
                }
              >
                {data.projects === null ? (
                  <p>Chưa tải được dự án.</p>
                ) : data.projects.length === 0 ? (
                  <p className="mb-4">
                    Chưa có dự án. Mở Dự án để xem thử thách và hướng dẫn tham
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
                            EMPATHIZE: "Thấu hiểu",
                            DEFINE: "Xác định vấn đề",
                            IDEATE: "Lên ý tưởng",
                            PROTOTYPE: "Tạo mẫu",
                            TEST: "Kiểm thử",
                          } as Record<string, string>
                        )[project.currentStage] ?? "Đang thực hiện"}
                      </p>
                    </div>
                  ))
                )}
                <Action href="/studio">
                  {lecturer ? "Quản lý thử thách và nhóm" : "Mở dự án và nhóm"}
                </Action>
              </Panel>
              <Panel title="Phản hồi và nhắc hạn">
                {data.notifications === null ? (
                  <p>Chưa tải được thông báo.</p>
                ) : data.notifications.length === 0 ? (
                  <p className="mb-4">
                    Chưa có thông báo. Phản hồi và nhắc hạn được gửi đến bạn sẽ
                    xuất hiện tại đây.
                  </p>
                ) : (
                  <ul className="mb-4 space-y-3">
                    {data.notifications.slice(0, 4).map((note) => (
                      <li key={note.id} className="rounded-xl border p-3">
                        <p className="break-words text-sm">{note.message}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {note.readAt ? "Đã đọc" : "Chưa đọc"} ·{" "}
                          {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <Action href="/notifications">Xem thông báo</Action>
              </Panel>
            </div>
            <section aria-labelledby="classic-modes-title" className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">DESIGN THINKING IN ACTION</p>
              <h2 id="classic-modes-title" className="mt-1 text-2xl font-extrabold">Năm chế độ. Vô hạn vòng lặp.</h2>
              <p className="mt-2 text-sm text-slate-600">Bạn có thể quay lại bất kỳ chế độ nào khi học được điều mới.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { name: "Empathize", vi: "Thấu hiểu con người", icon: Users, tone: "bg-blue-50 text-blue-700" },
                  { name: "Define", vi: "Xác định vấn đề", icon: GraduationCap, tone: "bg-violet-50 text-violet-700" },
                  { name: "Ideate", vi: "Mở rộng ý tưởng", icon: Lightbulb, tone: "bg-amber-50 text-amber-800" },
                  { name: "Prototype", vi: "Hiện thực hóa", icon: Layers3, tone: "bg-emerald-50 text-emerald-700" },
                  { name: "Test", vi: "Kiểm chứng", icon: RotateCcw, tone: "bg-rose-50 text-rose-700" },
                ].map(({ name, vi, icon: Icon, tone }) => (
                  <Link key={name} href="/studio" className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#b94708] hover:bg-slate-50"><span className={"grid size-10 place-items-center rounded-xl " + tone}><Icon size={20} aria-hidden="true"/></span><h3 className="mt-3 font-bold">{name}</h3><p className="mt-1 text-sm text-slate-600">{vi}</p></Link>
                ))}
              </div>
            </section>
            <details className="rounded-2xl border bg-white p-5">
              <summary className="min-h-11 cursor-pointer font-bold">
                Cần trợ giúp với bước tiếp theo?
              </summary>
              <p className="mt-3 text-sm leading-7">
                Khóa học giúp bạn học phương pháp. Dự án là nơi thực hành cùng
                nhóm. Lưu minh chứng, nộp bài và xem phản hồi để cải tiến. Bạn
                có thể quay lại bất kỳ hoạt động Design Thinking nào khi có phát
                hiện mới.
              </p>
              <Link
                href="/evidence"
                className="inline-flex min-h-11 items-center font-semibold underline"
              >
                Mở minh chứng và phản hồi
              </Link>
            </details>
          </>
        )}
        <footer className="border-t py-4 text-xs text-slate-600">
          UII Design Thinking Hub · Môi trường thử nghiệm
        </footer>
      </main>
    </div>
  );
}
