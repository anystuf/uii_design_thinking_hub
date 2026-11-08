'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, GraduationCap, LogOut,
  Plus, RefreshCw, ShieldCheck, Users, AlertCircle, Layers3,
} from 'lucide-react';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi as api } from '@/lib/authenticated-api';
import { AuthTimeoutError, withAuthDeadline } from '@/lib/auth-timeout';
import { getResourceLinks, getSafeHttpUrl, getYouTubeEmbedUrl } from '@/lib/learning-media';

type AppUser = { id: string; email: string; fullName: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR' };
type Course = {
  id: string; title: string; description?: string | null; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdById: string; level: string; lessons?: Lesson[];
};
type Lesson = {
  id: string; courseId: string; title: string; description?: string | null;
  content?: string | null; orderIndex: number; publishedAt?: string | null;
  contentType?: 'VIDEO' | 'ARTICLE' | 'WORKSHOP' | 'TEMPLATE' | 'ASSIGNMENT';
  videoUrl?: string | null; durationMinutes?: number;
};
type Enrollment = { id: string; courseId: string; course: Course };
type Progress = {
  courseId: string; totalLessons: number; completedLessons: number; percent: number;
  lessons: { lessonId: string; completed: boolean }[];
};


export default function LearningFoundationPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonType, setLessonType] = useState<NonNullable<Lesson['contentType']>>('ARTICLE');
  const [lessonPublished, setLessonPublished] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    try {
      const client = getSupabaseBrowserClient();
      void withAuthDeadline(() => client.auth.getSession()).then(({ data, error: authError }) => {
        if (!active) return;
        if (authError) setError(authError.message);
        setSession(data.session);
        setAuthReady(true);
      }).catch((err: unknown) => {
        if (active) { setError(err instanceof Error ? err.message : 'Không đọc được phiên đăng nhập.'); setAuthReady(true); }
      });
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (active) setSession(nextSession);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch (configError) {
      setError(configError instanceof Error ? configError.message : 'Supabase configuration missing.');
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setUser(null); setCourses([]); setEnrollments([]); setCourse(null);
      setLessons([]); setProgress(null);
      return;
    }
    let active = true;
    async function load() {
      setBusy(true);
      try {
        const token = session!.access_token;
        const me = await api<AppUser>('/auth/me', token);
        if (!active) return;
        setUser(me);
        const list = await api<Course[]>('/courses', token);
        if (!active) return;
        setCourses(list);
        if (me.role === 'STUDENT') {
          const enrolled = await api<Enrollment[]>('/courses/my-enrollments', token);
          if (active) setEnrollments(enrolled);
        }
        setError('');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load data.');
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [session?.access_token, reload]);

  function clearNotice() { setError(''); setMessage(''); }
  function fail(err: unknown) { setError(err instanceof Error ? err.message : 'Request failed.'); }
  const token = session?.access_token ?? '';
  const canTeach = user?.role === 'LECTURER' || user?.role === 'ADMIN';
  const isEnrolled = course ? enrollments.some((item) => item.courseId === course.id) : false;
  const canEditCourse = !!course && canTeach && (user?.role === 'ADMIN' || course.createdById === user?.id);
  const completed = new Set(progress?.lessons.filter((item) => item.completed).map((item) => item.lessonId) ?? []);

  async function refreshData() {
    if (!session) return;
    if (!user) { setReload((value) => value + 1); return; }
    clearNotice(); setBusy(true);
    try {
      const list = await api<Course[]>('/courses', token);
      setCourses(list);
      if (user?.role === 'STUDENT') {
        setEnrollments(await api<Enrollment[]>('/courses/my-enrollments', token));
      }
      if (course) await selectCourse(course.id);
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function signInOrUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authBusy || authTimedOut) return;
    clearNotice(); setAuthBusy(true);
    try {
      const auth = getSupabaseBrowserClient().auth;
      if (signUp) {
        const result = await withAuthDeadline(() => auth.signUp({ email: authEmail, password: authPassword }));
        if (result.error) throw result.error;
        setMessage('Account registered. Check your email for a confirmation link if required.');
      } else {
        const result = await withAuthDeadline(() => auth.signInWithPassword({ email: authEmail, password: authPassword }));
        if (result.error) throw result.error;
      }
    } catch (err) {
      if (err instanceof AuthTimeoutError || (err instanceof Error && err.message.includes('Đăng nhập chưa được xác nhận'))) {
        setAuthTimedOut(true);
        setError('Chưa xác nhận được đăng nhập hoặc đăng ký trong thời gian cho phép. Hãy tải lại trang để kiểm tra phiên hiện tại trước khi thử lại. Nếu vừa đăng ký, hãy kiểm tra email xác nhận.');
      } else { fail(err); }
    } finally { setAuthBusy(false); }
  }

  async function selectCourse(id: string, userOverride?: AppUser, enrollmentOverride?: Enrollment[]) {
    clearNotice(); setBusy(true);
    try {
      const selected = await api<Course>('/courses/' + id, token);
      setCourse(selected);
      const currentUser = userOverride ?? user;
      const joined = (enrollmentOverride ?? enrollments).some((item) => item.courseId === id);
      if (currentUser?.role !== 'STUDENT' || joined) {
        const list = await api<Lesson[]>('/courses/' + id + '/lessons', token);
        setLessons(list);
        if (currentUser?.role === 'STUDENT') {
          setProgress(await api<Progress>('/courses/' + id + '/my-progress', token));
        } else setProgress(null);
      } else {
        setLessons([]); setProgress(null);
      }
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function enroll() {
    if (!course) return; clearNotice(); setBusy(true);
    try {
      await api('/courses/' + course.id + '/enroll', token, { method: 'POST' });
      const enrolled = await api<Enrollment[]>('/courses/my-enrollments', token);
      setEnrollments(enrolled);
      await selectCourse(course.id, user ?? undefined, enrolled);
      setMessage('Ghi danh thành công.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); clearNotice(); setBusy(true);
    try {
      const created = await api<Course>('/courses', token, {
        method: 'POST',
        body: JSON.stringify({ title: courseTitle, description: courseDescription, level: 'Foundation' }),
      });
      setCourses((items) => [created, ...items]);
      setCourseTitle(''); setCourseDescription('');
      setMessage('Đã tạo khóa học dạng nháp.');
      await selectCourse(created.id);
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function publishCourse() {
    if (!course) return; clearNotice(); setBusy(true);
    try {
      const updated = await api<Course>('/courses/' + course.id, token, {
        method: 'PUT', body: JSON.stringify({ status: 'PUBLISHED' }),
      });
      setCourses((items) => items.map((item) => item.id === updated.id ? updated : item));
      setCourse(updated);
      setMessage('Khóa học đã được xuất bản.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!course) return;
    clearNotice(); setBusy(true);
    try {
      await api('/courses/' + course.id + '/lessons', token, {
        method: 'POST',
        body: JSON.stringify({
          title: lessonTitle, content: lessonContent, contentType: lessonType,
          videoUrl: lessonVideoUrl.trim() || undefined,
          orderIndex: lessons.length, isPublished: lessonPublished,
        }),
      });
      setLessonTitle(''); setLessonContent(''); setLessonVideoUrl(''); setLessonType('ARTICLE');
      setMessage('Đã tạo bài học.');
      await selectCourse(course.id);
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function publishLesson(lesson: Lesson) {
    clearNotice(); setBusy(true);
    try {
      await api('/lessons/' + lesson.id, token, {
        method: 'PUT', body: JSON.stringify({ isPublished: true }),
      });
      if (course) await selectCourse(course.id);
      setMessage('Đã xuất bản bài học.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  async function toggleProgress(lesson: Lesson) {
    clearNotice(); setBusy(true);
    const wasCompleted = completed.has(lesson.id);
    try {
      await api('/lessons/' + lesson.id + '/progress', token, {
        method: 'PUT', body: JSON.stringify({ completed: !wasCompleted }),
      });
      if (course) setProgress(await api<Progress>('/courses/' + course.id + '/my-progress', token));
      setMessage(wasCompleted ? 'Đã bỏ đánh dấu hoàn thành.' : 'Đã lưu tiến độ trên máy chủ.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <header className="border-b border-[#e5eaf2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#153b77] p-3 text-white"><GraduationCap size={22}/></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f37021]">UII Design Thinking Hub</p>
              <h1 className="text-xl font-extrabold">Learning Foundation</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-sm font-bold text-[#153b77] hover:underline">Design Studio →</Link>
            <Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-[#526681] hover:text-[#153b77]"><ArrowLeft size={16}/> Dashboard</Link>
            {session && <button type="button" className="flex items-center gap-1 rounded-full border px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => void getSupabaseBrowserClient().auth.signOut()}><LogOut size={16}/> Logout</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="shrink-0"/>{error}</div>}
        {message && <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}
        {!authReady && <p>Đang kiểm tra phiên đăng nhập…</p>}
        {authReady && !session && (
          <div className="mx-auto max-w-md rounded-3xl border border-[#e6ebf2] bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-[#153b77]"><ShieldCheck size={24}/><h2 className="text-2xl font-bold">{signUp ? 'Đăng ký' : 'Đăng nhập'}</h2></div>
            <p className="mb-6 text-sm text-slate-600">Dùng tài khoản Supabase Auth để truy cập dữ liệu học tập thực.</p>
            <form onSubmit={(event) => void signInOrUp(event)} className="space-y-4">
              <label className="block text-sm font-semibold">Email
                <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3" placeholder="student@example.edu"/>
              </label>
              <label className="block text-sm font-semibold">Mật khẩu
                <input required minLength={6} type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3"/>
              </label>
              <button disabled={authBusy || authTimedOut} className="w-full rounded-xl bg-[#153b77] px-4 py-3 font-semibold text-white disabled:opacity-50">{authBusy ? 'Đang xác thực tài khoản…' : (signUp ? 'Tạo tài khoản' : 'Đăng nhập')}</button>
              {authTimedOut && <button type="button" onClick={() => window.location.reload()} className="w-full rounded-xl border px-4 py-3 font-semibold">Tải lại trang để thử lại</button>}
            </form>
            <button type="button" className="mt-4 text-sm font-semibold text-[#153b77] underline" onClick={() => setSignUp((value) => !value)}>{signUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
          </div>
        )}
        {session && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold uppercase tracking-widest text-[#f37021]">{user?.role ?? 'Loading account'}</p>
                <h2 className="text-3xl font-extrabold">Xin chào, {user?.fullName ?? 'Learner'}</h2>
                <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              </div>
              <div className="rounded-full bg-[#e7eef9] px-4 py-2 text-sm font-bold text-[#153b77]">Release A · F01–F04</div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
              <section className="space-y-4">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold"><BookOpen size={18}/> Khóa học</h3>
                    <button type="button" title="Tải lại" disabled={busy} onClick={() => void refreshData()}><RefreshCw size={17}/></button>
                  </div>
                  <div className="space-y-2">
                    {courses.map((item) => (
                      <button key={item.id} type="button" onClick={() => void selectCourse(item.id)} className={'w-full rounded-xl border p-4 text-left transition hover:border-[#153b77] ' + (course?.id === item.id ? 'border-[#153b77] bg-[#eef3fa]' : 'bg-white')}>
                        <div className="flex items-start justify-between gap-2"><span className="font-bold">{item.title}</span><ChevronRight size={16} className="shrink-0"/></div>
                        <p className="mt-2 text-xs text-slate-500">{item.level} · {item.status}</p>
                        {enrollments.some((e) => e.courseId === item.id) && <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-green-700"><CheckCircle2 size={13}/> Đã ghi danh</span>}
                      </button>
                    ))}
                    {!courses.length && <p className="text-sm text-slate-500">Chưa có khóa học. {busy ? 'Đang tải…' : ''}</p>}
                  </div>
                </div>
                {canTeach && <form onSubmit={(event) => void createCourse(event)} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 font-bold"><Plus size={18}/> Tạo khóa học</h3>
                  <input required maxLength={160} value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="Tên khóa học" className="w-full rounded-xl border px-3 py-3 text-sm"/>
                  <textarea maxLength={1200} value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} placeholder="Mô tả khóa học" rows={3} className="w-full rounded-xl border px-3 py-3 text-sm"/>
                  <button disabled={busy} className="w-full rounded-xl bg-[#153b77] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Tạo khóa học nháp</button>
                </form>}
              </section>
              <section className="space-y-5">
                {!course ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-8 text-center">
                  <Layers3 className="mb-3 text-[#153b77]" size={32}/><h3 className="text-xl font-bold">Chọn một khóa học</h3><p className="mt-2 text-sm text-slate-500">Các nội dung ở đây được tải trực tiếp từ NestJS API.</p>
                </div> : (
                  <>
                    <div className="rounded-2xl border bg-white p-6 shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-[#edf2fb] px-3 py-1 text-xs font-bold text-[#153b77]">{course.status}</span>
                        {canEditCourse && course.status === 'DRAFT' && <button disabled={busy} type="button" onClick={() => void publishCourse()} className="rounded-full bg-[#f37021] px-4 py-2 text-xs font-bold text-white">Xuất bản khóa học</button>}
                      </div>
                      <h3 className="text-2xl font-extrabold">{course.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{course.description || 'Chưa có mô tả khóa học.'}</p>
                      {user?.role === 'STUDENT' && !isEnrolled && <button disabled={busy} type="button" onClick={() => void enroll()} className="mt-5 flex items-center gap-2 rounded-xl bg-[#153b77] px-5 py-3 text-sm font-bold text-white"><Users size={17}/> Ghi danh khóa học</button>}
                      {progress && <div className="mt-6">
                        <div className="mb-2 flex justify-between text-sm font-bold"><span>Learning progress</span><span>{progress.completedLessons}/{progress.totalLessons} · {progress.percent}%</span></div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div style={{ width: progress.percent + '%' }} className="h-full rounded-full bg-[#f37021]"/></div>
                      </div>}
                    </div>
                    {(canEditCourse || isEnrolled) && <div className="rounded-2xl border bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center gap-2"><BookOpen size={20} className="text-[#153b77]"/><h3 className="text-xl font-bold">Bài học</h3></div>
                      <div className="space-y-3">
                        {lessons.map((lesson, index) => (
                          <div key={lesson.id} className="rounded-xl border border-[#e8edf3] bg-[#fbfcfe] p-4">
                            <div className="flex flex-wrap justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-[#f37021]">LESSON {index+1}</p>
                                <h4 className="mt-1 font-bold">{lesson.title}</h4>
                                {lesson.description && <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>}
                                {getYouTubeEmbedUrl(lesson.videoUrl) && <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-slate-900"><iframe className="h-full w-full" src={getYouTubeEmbedUrl(lesson.videoUrl)!} title={lesson.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}
                                {lesson.videoUrl && !getYouTubeEmbedUrl(lesson.videoUrl) && getSafeHttpUrl(lesson.videoUrl) && <a className="mt-3 inline-flex text-sm font-semibold text-[#153b77] underline" href={getSafeHttpUrl(lesson.videoUrl)!} target="_blank" rel="noreferrer">Mở video trong tab mới ↗</a>}
                                {lesson.content && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{lesson.content}</p>}
                                {getResourceLinks(lesson.content).length > 0 && <div className="mt-3 flex flex-wrap gap-3">{getResourceLinks(lesson.content).map((resource) => <a key={resource} className="text-sm font-semibold text-[#153b77] underline" href={resource} target="_blank" rel="noreferrer">Tài liệu tham khảo ↗</a>)}</div>}
                                {!lesson.publishedAt && <p className="mt-2 text-xs text-amber-700">Bản nháp, chưa công bố</p>}
                              </div>
                              {user?.role === 'STUDENT' && <button disabled={busy} type="button" onClick={() => void toggleProgress(lesson)} className={'self-start rounded-lg px-3 py-2 text-xs font-bold ' + (completed.has(lesson.id) ? 'bg-green-100 text-green-800' : 'bg-[#e7eef9] text-[#153b77]')}>{completed.has(lesson.id) ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button>}
                              {canEditCourse && !lesson.publishedAt && <button disabled={busy} type="button" onClick={() => void publishLesson(lesson)} className="self-start rounded-lg border px-3 py-2 text-xs font-bold">Publish</button>}
                            </div>
                          </div>
                        ))}
                        {!lessons.length && <p className="text-sm text-slate-500">Chưa có bài học được công bố.</p>}
                      </div>
                    </div>}
                    {canEditCourse && <form onSubmit={(event) => void createLesson(event)} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 text-xl font-bold"><Plus size={20}/> Tạo bài học mới</h3>
                      <input required maxLength={160} value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Tiêu đề bài học" className="w-full rounded-xl border px-3 py-3 text-sm"/>
                      <select value={lessonType} onChange={(e) => setLessonType(e.target.value as NonNullable<Lesson['contentType']>)} className="w-full rounded-xl border px-3 py-3 text-sm" aria-label="Loại bài học"><option value="ARTICLE">Bài đọc</option><option value="VIDEO">Video</option><option value="WORKSHOP">Workshop</option><option value="TEMPLATE">Template</option><option value="ASSIGNMENT">Bài tập</option></select>
                      {(lessonType === 'VIDEO' || lessonVideoUrl) && <input type="url" value={lessonVideoUrl} onChange={(e) => setLessonVideoUrl(e.target.value)} placeholder="Link video YouTube (https://...)" className="w-full rounded-xl border px-3 py-3 text-sm" />}
                      <textarea required value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} maxLength={10000} rows={5} placeholder="Nội dung bài học" className="w-full rounded-xl border px-3 py-3 text-sm"/>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonPublished} onChange={(e) => setLessonPublished(e.target.checked)}/> Công bố bài học khi tạo</label>
                      <button disabled={busy} className="rounded-xl bg-[#153b77] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Lưu bài học</button>
                    </form>}
                  </>
                )}
              </section>
            </div>
            <p className="text-center text-xs text-slate-500">Live API learning slice · Design Studio và Assessment sẽ được kết nối ở các release tiếp theo.</p>
          </>
        )}
      </main>
    </div>
  );
}
