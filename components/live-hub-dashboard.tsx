"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowRight, BookOpen, RefreshCw } from "lucide-react";
import { WorkspaceNav } from "@/components/workspace-nav";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { authenticatedApi as api } from "@/lib/authenticated-api";
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
type Enrollment = { id: string; courseId: string; course: Course };
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
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
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 py-3 text-sm font-bold text-white hover:bg-blue-900"
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
    async (token: string, alive: () => boolean) => {
      setLoading(true);
      setError("");
      setPartialError("");
      try {
        // Roles come from the trusted API; no client-selectable role switch.
        const me = await api<Account>("/auth/me", token);
        if (!alive()) return;
        setAccount(me);
        const reviewer = me.role === "ADMIN" || me.role === "LECTURER";
        const [
          coursesResult,
          projectsResult,
          notificationsResult,
          enrollmentsResult,
          queueResult,
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
        ].filter((result) => result.status === "rejected").length;
        setData({
          courses,
          projects,
          notifications,
          enrollments,
          queue,
          progress: null,
          milestones: null,
        });
        if (failed)
          setPartialError(
            "Không thể tải " +
              failed +
              " nguồn dữ liệu. Một số chỉ số chưa sẵn sàng; hãy thử tải lại.",
          );
        const activeCourse = enrollments?.[0];
        const supplemental = await Promise.allSettled([
          me.role === "STUDENT" && activeCourse
            ? api<Progress>(
                "/courses/" +
                  encodeURIComponent(activeCourse.courseId) +
                  "/my-progress",
                token,
              )
            : Promise.resolve(null),
          me.role === "STUDENT" && projects !== null
            ? Promise.all(
                (projects ?? [])
                  .filter((project) => project.challengeId)
                  .map((project) =>
                    api<{ challenge: { milestones: Milestone[] } | null }>(
                      "/teams/" + encodeURIComponent(project.id),
                      token,
                    ),
                  ),
              ).then((teams) =>
                [
                  ...new Map(
                    teams
                      .flatMap((team) => team.challenge?.milestones ?? [])
                      .filter((m) => m.dueAt)
                      .map((m) => [m.id, m]),
                  ).values(),
                ].sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!)),
              )
            : Promise.resolve(null),
        ]);
        if (!alive()) return;
        setData((previous) => ({
          ...previous,
          progress: valueOf(supplemental[0]),
          milestones: valueOf(supplemental[1]),
        }));
        if (supplemental.some((result) => result.status === "rejected"))
          setPartialError(
            "Một số tiến độ hoặc mốc dự án chưa tải được. Hãy thử tải lại.",
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
    void loadDashboard(token, () => alive);
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
  const nextCourse = data.enrollments?.[0]?.course;
  const title = student
    ? "Việc học của tôi"
    : admin
      ? "Quản trị nền tảng"
      : lecturer
        ? "Không gian giảng dạy"
        : "Tổng quan";
  return (
    <div className="min-h-screen bg-slate-50 text-[#12284a]">
      <WorkspaceNav
        title={title}
        role={account?.role}
        onSignOut={account ? () => void signOut() : undefined}
      />
      <main
        id="main-content"
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
        {(!authReady || loading) && (
          <div
            role="status"
            className="space-y-3 rounded-2xl border bg-white p-6"
          >
            <p className="flex items-center gap-2">
              <RefreshCw size={18} className="animate-spin" />
              Đang tải không gian của bạn…
            </p>
            <div
              aria-hidden="true"
              className="h-24 animate-pulse rounded-xl bg-slate-100"
            />
          </div>
        )}
        {authReady && !session && (
          <Panel title="Chào mừng bạn">
            <p className="mb-4">
              Đăng nhập để xem khóa học, dự án và phản hồi của bạn.
            </p>
            <Action href="/learn">Đăng nhập</Action>
          </Panel>
        )}
        {session && !loading && !account && (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">
                  Xin chào, {account.fullName}
                </p>
                <p className="mt-1 text-sm">
                  {roleName(account.role)} · Chọn công việc tiếp theo của bạn.
                </p>
              </div>
              <button
                aria-label="Làm mới dữ liệu"
                disabled={loading}
                className="min-h-11 rounded-xl border bg-white px-4"
                onClick={() => setReload((n) => n + 1)}
              >
                Làm mới
              </button>
            </div>
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
                        ? "/learn?course=" + encodeURIComponent(nextCourse.id)
                        : "/learn"
                    }
                  >
                    {nextCourse ? "Tiếp tục học" : "Khám phá khóa học"}
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
                            Mở chương trình và tiến độ học →
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
