'use client';

import Link from 'next/link';
import { LearningAuthForm } from '@/components/learning-auth-form';
import { WorkspaceLoading } from '@/components/workspace-loading';
import { WorkspaceNav } from '@/components/workspace-nav';
import { LessonPractice } from '@/components/lesson-practice';
import { LearningQuestCompass, type FocusStep } from '@/components/learning-quest-compass';
import { DesignThinkingLessonGuide } from '@/components/design-thinking-lesson-guide';
import { DemoPhoto } from '@/components/demo-photo';
import { DEMO_COURSES } from '@/lib/demo-content';
import { DESIGN_THINKING_KIT, findKitLesson } from '@/lib/design-thinking-learning-kit';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, GraduationCap,
  Plus, RefreshCw, Users, AlertCircle, Layers3, PlayCircle, Clock3, FileText, Video, ListChecks, Sparkles, Search, X,
} from 'lucide-react';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi as api, workspaceProfile } from '@/lib/authenticated-api';
import { withAuthDeadline } from '@/lib/auth-timeout';
import { getResourceLinks, getSafeHttpUrl, getYouTubeEmbedUrl } from '@/lib/learning-media';

type AppUser = { id: string; email: string; fullName: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR' };
type Course = {
  id: string; title: string; description?: string | null; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdById: string; level: string; lessons?: Lesson[];
  createdBy?: { fullName: string; id: string }; _count?: { lessons?: number; enrollments?: number };
};
type Lesson = {
  id: string; courseId: string; title: string; description?: string | null;
  content?: string | null; orderIndex: number; publishedAt?: string | null;
  contentType?: 'VIDEO' | 'ARTICLE' | 'WORKSHOP' | 'TEMPLATE' | 'ASSIGNMENT';
  videoUrl?: string | null; durationMinutes?: number; thumbnailUrl?: string | null; isPreview?: boolean;
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonType, setLessonType] = useState<NonNullable<Lesson['contentType']>>('ARTICLE');
  const [lessonPublished, setLessonPublished] = useState(true);
  const [reload, setReload] = useState(0);
  const focusCourse = useRef<string | null>(null);
  const courseHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusCourse.current && course?.id === focusCourse.current) {
      courseHeading.current?.focus({ preventScroll: true });
      courseHeading.current?.scrollIntoView({ block: 'start' });
      focusCourse.current = null;
    }
  }, [course]);
  const [courseSearch, setCourseSearch] = useState('');
  const [catalogView, setCatalogView] = useState<'all' | 'enrolled'>('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [learningView, setLearningView] = useState<'overview' | 'player'>('overview');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusStep, setFocusStep] = useState<FocusStep>('learn');
  useEffect(() => {
    const active = user?.role === 'STUDENT' && learningView === 'player' && focusMode;
    if (active) document.documentElement.dataset.uiiFocusMode = 'true';
    else delete document.documentElement.dataset.uiiFocusMode;
    window.dispatchEvent(new Event('uii:focus-mode-changed'));
    return () => {
      delete document.documentElement.dataset.uiiFocusMode;
      window.dispatchEvent(new Event('uii:focus-mode-changed'));
    };
  }, [user?.role, learningView, focusMode]);

  useEffect(() => {
    if (!focusMode || learningView !== 'player') return;
    const target = document.getElementById('quest-task-' + focusStep);
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'auto' });
    target.focus({ preventScroll: true });
  }, [focusMode, focusStep, learningView, activeLessonId]);


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
        const me = await workspaceProfile<AppUser>(token, reload > 0);
        if (!active) return;
        setUser(me);
        const [list, currentEnrollments] = await Promise.all([
          api<Course[]>('/courses', token),
          me.role === 'STUDENT' ? api<Enrollment[]>('/courses/my-enrollments', token) : Promise.resolve([]),
        ]);
        if (!active) return;
        setCourses(list);
        setEnrollments(currentEnrollments);
        if (!active) return;
        const requestedCourse = new URLSearchParams(window.location.search).get('course');
        if (requestedCourse && list.some(item => item.id === requestedCourse)) {
          await selectCourse(requestedCourse, me, currentEnrollments);
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
  const resumedCourse = useRef<string | null>(null);
  useEffect(() => {
    if (!course || !progress || user?.role !== 'STUDENT' || resumedCourse.current === course.id) return;
    if (new URLSearchParams(window.location.search).get('course') !== course.id) return;
    const done = new Set(progress.lessons.filter(item => item.completed).map(item => item.lessonId));
    const next = lessons.find(item => !done.has(item.id));
    if (!next) return;
    resumedCourse.current = course.id;
    document.getElementById('lesson-' + next.id)?.querySelector('summary')?.focus();
  }, [course, progress, lessons, user?.role]);

  const visibleCourses = courses.filter((item) =>
    (item.title + ' ' + (item.description ?? '')).toLocaleLowerCase('vi').includes(courseSearch.trim().toLocaleLowerCase('vi')) &&
    (catalogView === 'all' || enrollments.some((enrollment) => enrollment.courseId === item.id)) &&
    (levelFilter === 'all' || item.level === levelFilter),
  );
  const levels = [...new Set(courses.map(item => item.level).filter(Boolean))];
  const currentLesson = lessons.find(item => item.id === activeLessonId) ?? null;
  const selectedLessonIndex = currentLesson ? lessons.findIndex(item => item.id === currentLesson.id) : -1;
  const nextUnfinishedLesson = lessons.find(item => !completed.has(item.id)) ?? lessons[0];
  function openLesson(lesson: Lesson) {
    if (!course) return;
    setActiveLessonId(lesson.id);
    setFocusStep('learn');
    setLearningView('player');
    window.history.replaceState(window.history.state, '', '/learn?course=' + encodeURIComponent(course.id) + '&lesson=' + encodeURIComponent(lesson.id));
  }
  useEffect(() => {
    if (learningView === 'player' && activeLessonId) {
      document.getElementById('lesson-player-title')?.focus({ preventScroll: true });
      document.getElementById('lesson-player')?.scrollIntoView({ block: 'start' });
    }
  }, [learningView, activeLessonId]);

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

  async function selectCourse(id: string, userOverride?: AppUser, enrollmentOverride?: Enrollment[], moveFocus = false) {
    clearNotice(); setBusy(true);
    setEditingLessonId(null);
    setLessonTitle(''); setLessonContent(''); setLessonVideoUrl(''); setLessonType('ARTICLE');
    const currentUser = userOverride ?? user;
    const joined = (enrollmentOverride ?? enrollments).some(item => item.courseId === id);
    const path = '/courses/' + encodeURIComponent(id);
    try {
      const [selected, list, nextProgress] = await Promise.all([
        api<Course>(path, token),
        currentUser && (currentUser.role !== 'STUDENT' || joined) ? api<Lesson[]>(path + '/lessons', token) : Promise.resolve([]),
        currentUser?.role === 'STUDENT' && joined ? api<Progress>(path + '/my-progress', token) : Promise.resolve(null),
      ]);
      if (moveFocus) focusCourse.current = id;
      setCourse(selected);
      const availableLessons = list.length ? list : (selected.lessons ?? []).filter(item => item.isPreview);
      setLessons(availableLessons);
      setProgress(nextProgress);
      const requestedLesson = !moveFocus ? new URLSearchParams(window.location.search).get('lesson') : null;
      if (requestedLesson && availableLessons.some(item => item.id === requestedLesson)) {
        setActiveLessonId(requestedLesson); setLearningView('player');
      } else {
        setActiveLessonId(null); setLearningView('overview');
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

  async function createGuidedStarterCourse() {
    if (!canTeach || busy) return;
    clearNotice(); setBusy(true);
    let newCourse: Course | null = null;
    let lessonsCreated = 0;
    let quizzesCreated = 0;
    try {
      newCourse = await api<Course>('/courses', token, {
        method: 'POST',
        body: JSON.stringify({
          title: 'Design Thinking Foundations · Guided Studio',
          description: 'Lộ trình thực hành 5 chế độ Design Thinking. Mỗi bài có kiến thức, nhiệm vụ thực tế, quiz và kết quả cần lưu vào Design Studio. Khóa học được tạo dạng nháp để giảng viên kiểm duyệt trước khi công bố.',
          level: 'Foundation',
        }),
      });
      const id = newCourse.id;
      setCourses(items => [newCourse!, ...items]);
      for (const [index, kit] of DESIGN_THINKING_KIT.entries()) {
        const createdLesson = await api<Lesson>('/courses/' + id + '/lessons', token, {
          method: 'POST',
          body: JSON.stringify({
            title: kit.title, content: kit.content,
            contentType: 'WORKSHOP', orderIndex: index, isPublished: true,
          }),
        });
        lessonsCreated += 1;
        await api('/lessons/' + createdLesson.id + '/exercise', token, {
          method: 'PUT',
          body: JSON.stringify({
            kind: 'QUIZ', title: 'Kiểm tra hiểu bài · ' + kit.mode,
            instructions: 'Trả lời câu hỏi, xem giải thích và trở lại nhiệm vụ thực hành.',
            items: [{
              prompt: kit.quiz.prompt, options: [...kit.quiz.options],
              correctIndex: kit.quiz.correctIndex,
              explanation: kit.quiz.explanation, points: 1,
            }],
            passingScore: 70, maxAttempts: 3, published: true, dueAt: null,
          }),
        });
        quizzesCreated += 1;
      }
      await selectCourse(id);
      setMessage('Đã tạo khóa học nháp với 5 bài thực hành và 5 quiz. Vui lòng kiểm tra từng bài trước khi xuất bản khóa học.');
    } catch (err) {
      if (newCourse) {
        await selectCourse(newCourse.id);
        setError('Tạo khóa học chưa hoàn tất (' + lessonsCreated + '/5 bài, ' + quizzesCreated + '/5 quiz). Dữ liệu đã tạo vẫn được giữ trên máy chủ. Hãy kiểm tra khóa học nháp, không bấm tạo lại để tránh trùng. Chi tiết: ' + (err instanceof Error ? err.message : 'Không rõ lỗi.'));
      } else fail(err);
    } finally { setBusy(false); }
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
      await api(editingLessonId ? '/lessons/' + editingLessonId : '/courses/' + course.id + '/lessons', token, {
        method: editingLessonId ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: lessonTitle, content: lessonContent, contentType: lessonType,
          videoUrl: lessonVideoUrl.trim() || null,
          orderIndex: editingLessonId ? lessons.find((lesson) => lesson.id === editingLessonId)?.orderIndex : lessons.length,
          isPublished: lessonPublished,
        }),
      });
      setLessonTitle(''); setLessonContent(''); setLessonVideoUrl(''); setLessonType('ARTICLE');
      setEditingLessonId(null);
      setMessage('Đã lưu bài học.');
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
      window.dispatchEvent(new Event('uii:learning-progress-changed'));
      setMessage(wasCompleted ? 'Đã bỏ đánh dấu hoàn thành.' : 'Đã lưu tiến độ trên máy chủ.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  return (
    <div className="uii-workspace min-h-screen bg-[#f5f7fb] text-[#12284a]">
      <WorkspaceNav title="Khóa học" role={user?.role} guest={!session} onSignOut={session ? () => void getSupabaseBrowserClient().auth.signOut() : undefined} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1320px] space-y-7 px-4 py-7 sm:px-7 lg:px-9">
        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="shrink-0"/><span>{error}</span></div>}
        {message && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
        {!authReady && <WorkspaceLoading label="Đang kiểm tra phiên đăng nhập…"/>}
        {authReady && !session && <LearningAuthForm />}
        {session && !user && busy && <WorkspaceLoading label="Đang xác minh tài khoản…"/>}
        {session && !user && error && !busy && <button type="button" onClick={() => setReload(n => n + 1)} className="min-h-11 rounded-xl border bg-white px-4 font-semibold">Thử lại</button>}
        {session && user && <>
          <section className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-[30px] border border-[#b1e0e8] bg-[#bdeaf4] p-6 sm:p-9">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#b94708]">UII · LEARNING EXPERIENCE</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">Không gian khóa học</h1>
              <p className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#b5362a]">Try, learn, try again.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{canTeach ? 'Thiết kế và quản lý những trải nghiệm học tập thực hành.' : 'Khám phá kiến thức, học theo tiến độ riêng và áp dụng vào dự án thực tế.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">{user.role === 'STUDENT' ? 'Sinh viên' : user.role === 'LECTURER' ? 'Giảng viên' : user.role === 'ADMIN' ? 'Quản trị viên' : 'Cố vấn'}</span>
            </div>
          </section>

          {user.role === 'STUDENT' && <section aria-labelledby="learning-path-title" className="overflow-hidden rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#153b77]"><GraduationCap size={27} aria-hidden="true"/></div>
              <div className="min-w-0 flex-1">
                <h2 id="learning-path-title" className="text-xl font-extrabold">{enrollments.length ? 'Tiếp tục hành trình của bạn' : 'Bắt đầu hành trình Design Thinking'}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Khám phá khóa học, học qua video và thực hành phương pháp thiết kế cùng nhóm.</p>
              </div>
              <a href="#course-catalog" onClick={() => setCatalogView(enrollments.length ? 'enrolled' : 'all')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-5 py-3 text-sm font-bold text-white hover:bg-[#214d8a]">{enrollments.length ? 'Xem khóa học của tôi' : 'Khám phá khóa học'} <ArrowRight size={16}/></a>
            </div>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              <li className="rounded-xl bg-blue-50 p-3 text-sm"><strong className="block">01 · Khám phá</strong><span className="text-slate-600">Chọn khóa học và ghi danh.</span></li>
              <li className="rounded-xl bg-orange-50 p-3 text-sm"><strong className="block">02 · Học và thực hành</strong><span className="text-slate-600">Xem bài học, lưu tiến độ.</span></li>
              <li className="rounded-xl bg-emerald-50 p-3 text-sm"><strong className="block">03 · Áp dụng</strong><span className="text-slate-600">Thực hiện thử thách cùng nhóm.</span></li>
            </ol>
          </section>}

          <section id="course-catalog" className="scroll-mt-4 space-y-4" aria-labelledby="course-catalog-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ad4007]">COURSE CATALOG</p><h2 id="course-catalog-title" className="mt-1 text-2xl font-extrabold">Khám phá khóa học</h2><p className="mt-1 text-sm text-slate-600">Chọn một hành trình phù hợp và bắt đầu học theo nhịp độ của bạn.</p></div>
              <button type="button" disabled={busy} onClick={() => void refreshData()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:border-blue-400"><RefreshCw size={16} aria-hidden="true"/> Làm mới</button>
            </div>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="min-w-[180px] flex-[2]">
                <label htmlFor="course-search" className="mb-1 block text-sm font-semibold">Tìm khóa học</label>
                <input id="course-search" type="search" value={courseSearch} onChange={event => setCourseSearch(event.target.value)} placeholder="Tên khóa học hoặc chủ đề…" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base focus:border-[#153b77]"/>
              </div>
              <div className="min-w-[145px] flex-1">
                <label htmlFor="course-level" className="mb-1 block text-sm font-semibold">Trình độ</label>
                <select id="course-level" value={levelFilter} onChange={event => setLevelFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base">
                  <option value="all">Tất cả trình độ</option>
                  {levels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              {user.role === 'STUDENT' && <div className="flex min-w-[175px] items-end gap-2" aria-label="Lọc khóa học">
                <button type="button" aria-pressed={catalogView === 'all'} onClick={() => setCatalogView('all')} className={"min-h-11 rounded-xl border px-3 text-sm font-semibold " + (catalogView === 'all' ? 'border-[#153b77] bg-blue-50 text-[#153b77]' : 'text-slate-700')}>Tất cả</button>
                <button type="button" aria-pressed={catalogView === 'enrolled'} onClick={() => setCatalogView('enrolled')} className={"min-h-11 rounded-xl border px-3 text-sm font-semibold " + (catalogView === 'enrolled' ? 'border-[#153b77] bg-blue-50 text-[#153b77]' : 'text-slate-700')}>Đã ghi danh ({enrollments.length})</button>
              </div>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((item, index) => {
                const joined = enrollments.find(record => record.courseId === item.id);
                return <button key={item.id} type="button" disabled={busy} onClick={() => void selectCourse(item.id, undefined, undefined, true)} aria-pressed={course?.id === item.id} className={"group overflow-hidden rounded-[22px] border bg-white text-left shadow-[0_6px_28px_rgba(20,42,78,0.05)] transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-4 focus-visible:outline-blue-600 " + (course?.id === item.id ? 'border-[#153b77] ring-2 ring-blue-100' : 'border-slate-200')}>
                  <div className="relative flex min-h-[170px] items-end overflow-hidden bg-[#a9dadd] p-5 text-white">
                    <DemoPhoto src={DEMO_COURSES[index % DEMO_COURSES.length].photo}
                      alt={"Ảnh minh họa Design Thinking cho khóa học " + item.title}
                      tint={DEMO_COURSES[index % DEMO_COURSES.length].accent}
                      className="absolute inset-0 h-full w-full"/>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071f37]/80 via-[#1c4055]/20 to-transparent"/>
                    <div className="relative flex w-full items-end justify-between gap-3"><span className="rounded-lg bg-[#0d2a46]/65 px-3 py-1.5 text-xs font-bold backdrop-blur">UII · DESIGN THINKING</span><GraduationCap size={31} aria-hidden="true" className="text-white"/></div>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{item.level || 'Khóa học'}</span><span className="text-xs text-slate-500">{item.status === 'PUBLISHED' ? 'Đang mở' : item.status === 'DRAFT' ? 'Bản nháp' : 'Lưu trữ'}</span></div>
                    <p className="line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#10284a]">{item.title}</p>
                    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{item.description || 'Khám phá kiến thức và thực hành phương pháp thiết kế lấy con người làm trung tâm.'}</p>
                    {item.createdBy?.fullName && <p className="text-xs text-slate-600">Giảng viên: {item.createdBy.fullName}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-slate-600"><span>{item._count?.lessons != null ? item._count.lessons + ' bài học' : 'Lộ trình học tập'}</span><span className="inline-flex items-center gap-1 font-bold text-[#153b77]">{joined ? 'Tiếp tục học' : 'Xem khóa học'} <ChevronRight size={15} aria-hidden="true"/></span></div>
                  </div>
                </button>;
              })}
            </div>
            {!visibleCourses.length && <div role="status" className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-600">{busy ? 'Đang tải khóa học…' : courseSearch || levelFilter !== 'all' ? 'Không có khóa học phù hợp. Hãy thử từ khóa khác.' : catalogView === 'enrolled' ? 'Bạn chưa ghi danh. Chọn Tất cả để khám phá khóa học.' : 'Khóa học sẽ xuất hiện tại đây khi được giảng viên công bố.'}</div>}
          </section>

          {canTeach && <details className="rounded-2xl border bg-white p-5" id="course-authoring">
            <summary className="min-h-11 cursor-pointer text-lg font-bold">Dành cho giảng viên · Tạo khóa học mới</summary>
            <form onSubmit={event => void createCourse(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Tên khóa học<input required maxLength={160} value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border px-3"/></label>
              <label className="block text-sm font-semibold">Mô tả khóa học<textarea maxLength={1200} value={courseDescription} onChange={e => setCourseDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border px-3 py-2"/></label>
              <button disabled={busy} className="min-h-11 rounded-xl bg-[#153b77] px-5 font-bold text-white disabled:opacity-50">Tạo khóa học nháp</button>
            </form>
            <div className="mt-4 space-y-2 border-t pt-4">
              <h3 className="text-base font-extrabold">Bộ học liệu mẫu · Design Thinking Foundations</h3>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">Tạo một khóa học <strong>nháp</strong> gồm 5 bài theo Empathize, Define, Ideate, Prototype, Test; mỗi bài có bài đọc gốc, nhiệm vụ áp dụng và một quiz tự chấm. Các hoạt động sẽ lưu vào máy chủ khi giảng viên xác nhận tạo. Không tự động xuất bản khóa học.</p>
              <button type="button" disabled={busy} onClick={() => void createGuidedStarterCourse()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#153b77] px-4 py-3 text-sm font-extrabold text-[#153b77] hover:bg-blue-50 disabled:opacity-50"><Plus size={17} aria-hidden="true"/> Tạo khóa học mẫu 5 bài + quiz</button>
            </div>
          </details>}

          {!course ? <section className="rounded-2xl border border-dashed bg-white p-10 text-center"><BookOpen size={34} className="mx-auto text-[#153b77]"/><h2 className="mt-3 text-xl font-extrabold">Chọn một khóa học</h2><p className="mt-2 text-sm text-slate-600">Xem giới thiệu, chương trình và ghi danh để bắt đầu.</p></section> : <>
            <section id="course-detail" className="scroll-mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm" aria-labelledby="course-detail-title">
              <div className="border-b bg-[#f7f9fd] p-5 sm:p-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#153b77]">{course.status === 'PUBLISHED' ? 'Đang mở ghi danh' : course.status === 'DRAFT' ? 'Bản nháp' : 'Đã lưu trữ'}</span>
                  {canEditCourse && course.status === 'DRAFT' && <button type="button" disabled={busy} onClick={() => void publishCourse()} className="min-h-11 rounded-xl bg-[#b94708] px-5 text-sm font-bold text-white">Xuất bản khóa học</button>}
                  <button type="button" onClick={() => {setCourse(null); setLessons([]); setProgress(null); setLearningView('overview'); setActiveLessonId(null);}} className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 text-sm font-semibold text-[#153b77]"><X size={16} aria-hidden="true"/> Đóng chi tiết</button>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ad4007]">COURSE OVERVIEW</p>
                <h2 id="course-detail-title" ref={courseHeading} tabIndex={-1} className="scroll-mt-4 mt-2 text-2xl font-extrabold outline-none focus-visible:outline sm:text-3xl">{course.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{course.description || 'Giảng viên chưa thêm mô tả khóa học.'}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  {course.level && <span className="inline-flex items-center gap-2"><GraduationCap size={16} aria-hidden="true"/>{course.level}</span>}
                  {course.createdBy?.fullName && <span>Giảng viên: {course.createdBy.fullName}</span>}
                  {lessons.length > 0 && <span className="inline-flex items-center gap-2"><BookOpen size={16} aria-hidden="true"/>{lessons.length} bài học có thể xem</span>}
                  {lessons.some(item => item.durationMinutes && item.durationMinutes > 0) && <span className="inline-flex items-center gap-2"><Clock3 size={16} aria-hidden="true"/>{lessons.reduce((total, item) => total + (item.durationMinutes ?? 0), 0)} phút nội dung đã định thời lượng</span>}
                </div>
                {user.role === 'STUDENT' && !isEnrolled && <button disabled={busy} type="button" onClick={() => void enroll()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-6 py-3 text-sm font-bold text-white hover:bg-blue-900"><Users size={18} aria-hidden="true"/> Ghi danh khóa học</button>}
                {isEnrolled && nextUnfinishedLesson && <button type="button" onClick={() => openLesson(nextUnfinishedLesson)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-6 py-3 text-sm font-bold text-white hover:bg-orange-800"><PlayCircle size={19} aria-hidden="true"/>{progress?.percent === 100 ? 'Ôn tập bài học' : 'Bắt đầu / tiếp tục học'}</button>}
                {progress && <div className="mt-5 max-w-xl"><div className="mb-2 flex justify-between gap-3 text-sm font-semibold"><span>Tiến độ của bạn</span><span>{progress.completedLessons}/{progress.totalLessons} bài · {progress.percent}%</span></div><div role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#b94708]" style={{width:progress.percent+'%'}}/></div></div>}
              </div>
              {learningView === 'overview' && <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1fr)_280px] sm:p-8">
                <div className="space-y-7">
                  <div><h3 className="text-xl font-extrabold">Bạn sẽ học được gì?</h3><p className="mt-2 text-sm leading-7 text-slate-600">{course.description || 'Khám phá các phương pháp học và thực hành theo định hướng của giảng viên.'}</p></div>
                  <div><h3 className="mb-4 text-xl font-extrabold">Chương trình học</h3>
                    <div className="space-y-3">
                      {lessons.map((lesson,index) => <div key={lesson.id} className="space-y-2">
                        {findKitLesson(lesson.title) && <h4 className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#153b77]"><span className="rounded-full bg-blue-50 px-3 py-1">CHƯƠNG {index+1} · {findKitLesson(lesson.title)!.mode}</span><span className="text-xs font-normal text-slate-600">{findKitLesson(lesson.title)!.objective}</span></h4>}
                        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#153b77]">{lesson.contentType === 'VIDEO' ? <PlayCircle size={20}/> : lesson.contentType === 'ASSIGNMENT' ? <ListChecks size={20}/> : <FileText size={20}/>}</span><div className="min-w-0"><p className="text-xs font-semibold text-[#b94708]">Bài {index+1} · {lesson.contentType === 'VIDEO' ? 'Video' : lesson.contentType === 'WORKSHOP' ? 'Workshop' : lesson.contentType === 'ASSIGNMENT' ? 'Bài tập' : 'Bài đọc'}</p><h4 className="mt-1 font-bold">{lesson.title}</h4>{lesson.description && <p className="mt-1 text-sm text-slate-600">{lesson.description}</p>}{lesson.durationMinutes ? <p className="mt-1 text-xs text-slate-600">{lesson.durationMinutes} phút</p> : null}</div></div>
                        <div className="flex flex-wrap items-center gap-2">{completed.has(lesson.id) && <span className="text-xs font-bold text-emerald-700"><CheckCircle2 size={15} className="inline"/> Đã học</span>}{(isEnrolled || canEditCourse || lesson.isPreview) && <button type="button" className="min-h-11 rounded-xl border border-blue-200 px-3 text-sm font-bold text-[#153b77]" onClick={() => openLesson(lesson)}>Mở bài học</button>}{canEditCourse && <button type="button" disabled={busy} className="min-h-11 rounded-xl border px-3 text-sm font-semibold" onClick={() => {setEditingLessonId(lesson.id); setLessonTitle(lesson.title);setLessonContent(lesson.content??'');setLessonVideoUrl(lesson.videoUrl??'');setLessonType(lesson.contentType??'ARTICLE');setLessonPublished(!!lesson.publishedAt);document.getElementById('lesson-editor')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('lesson-title')?.focus({preventScroll:true});}}>Chỉnh sửa bài học</button>}{canEditCourse && !lesson.publishedAt && <button type="button" className="min-h-11 rounded-xl border px-3 text-sm font-semibold" disabled={busy} onClick={() => void publishLesson(lesson)}>Xuất bản bài học</button>}</div>
                        </div>
                      </div>)}
                      {lessons.length === 0 && <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{isEnrolled || canEditCourse ? 'Khóa học chưa có bài học được công bố.' : 'Ghi danh để xem nội dung học tập. Một số bài học xem trước có thể xuất hiện tại đây.'}</div>}
                    </div>
                  </div>
                </div>
                <aside className="self-start rounded-2xl bg-[#edf3fa] p-5">
                  <h3 className="font-extrabold">Học tập cùng UII</h3><p className="mt-2 text-sm leading-6 text-slate-600">Học phương pháp, thực hành và quay lại cải tiến dựa trên phản hồi.</p>
                  <ol className="mt-4 space-y-3 text-sm text-slate-700"><li>1. Xem bài học và ghi chú</li><li>2. Hoàn thành bài học theo tiến độ</li><li>3. Áp dụng phương pháp vào dự án</li></ol>
                  <Link href="/studio" className="mt-5 inline-flex min-h-11 items-center gap-1 font-bold text-[#153b77] underline">Khám phá Design Studio <ArrowRight size={16}/></Link>
                </aside>
              </div>}
            </section>
            {learningView === 'player' && currentLesson && <section id="lesson-player" className="scroll-mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm" aria-label="Không gian học bài">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
                <button type="button" onClick={() => {setLearningView('overview'); setActiveLessonId(null);window.history.replaceState(window.history.state,'','/learn?course='+encodeURIComponent(course.id));}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"><ArrowLeft size={17}/> Chương trình khóa học</button>
                <span className="text-sm font-semibold text-slate-600">Bài {selectedLessonIndex+1}/{lessons.length}</span>
              </div>
              <div className={focusMode && user.role === "STUDENT" ? "grid" : "grid lg:grid-cols-[260px_minmax(0,1fr)]"}>
                <aside className={focusMode && user.role === "STUDENT" ? "hidden" : "border-b border-slate-200 bg-[#f8fafd] p-4 lg:border-b-0 lg:border-r"} aria-label="Danh sách bài học">
                  <h3 className="mb-3 font-extrabold">Nội dung khóa học</h3>
                  <div className="space-y-2">{lessons.map((lesson,index) => <button key={lesson.id} type="button" aria-current={currentLesson.id===lesson.id?'step':undefined} onClick={() => openLesson(lesson)} className={"flex min-h-11 w-full items-start gap-2 rounded-xl border px-3 py-3 text-left text-sm "+(currentLesson.id===lesson.id?'border-[#153b77] bg-blue-50 font-bold text-[#153b77]':'border-transparent hover:border-slate-200 hover:bg-white')}><span>{index+1}.</span><span className="min-w-0 flex-1">{lesson.title}{completed.has(lesson.id) && <span className="mt-1 block text-xs text-emerald-700">✓ Đã hoàn thành</span>}</span></button>)}</div>
                </aside>
                <article className="min-w-0 space-y-6 p-5 sm:p-8">
                  <div><p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">LEARNING PLAYER</p><h3 id="lesson-player-title" tabIndex={-1} className="mt-2 text-2xl font-extrabold outline-none focus-visible:outline sm:text-3xl">{currentLesson.title}</h3>{currentLesson.description && <p className="mt-2 text-sm leading-7 text-slate-600">{currentLesson.description}</p>}</div>
                  {user.role === 'STUDENT' && isEnrolled && <LearningQuestCompass
                    key={course.id} courseId={course.id} userId={user.id} token={token}
                    lessonCompleted={completed.has(currentLesson.id)}
                    focusMode={focusMode} focusStep={focusStep}
                    onFocusModeChange={setFocusMode} onFocusStepChange={setFocusStep}
                  />}
                  <div id="quest-task-learn" role="region" aria-label="Học nội dung bài" tabIndex={-1} className={focusMode && focusStep !== "learn" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5 space-y-6"}>
                  {getYouTubeEmbedUrl(currentLesson.videoUrl) && <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950"><iframe title={'Video bài học: '+currentLesson.title} src={getYouTubeEmbedUrl(currentLesson.videoUrl)!} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" allowFullScreen/></div>}
                  {currentLesson.videoUrl && !getYouTubeEmbedUrl(currentLesson.videoUrl) && getSafeHttpUrl(currentLesson.videoUrl) && (/\.(mp4|webm)(\?|#|$)/i.test(currentLesson.videoUrl)) && <video className="aspect-video w-full rounded-2xl bg-black" controls preload="metadata" src={getSafeHttpUrl(currentLesson.videoUrl)!}>Trình duyệt không hỗ trợ phát video.</video>}
                  {currentLesson.videoUrl && !getYouTubeEmbedUrl(currentLesson.videoUrl) && getSafeHttpUrl(currentLesson.videoUrl) && !(/\.(mp4|webm)(\?|#|$)/i.test(currentLesson.videoUrl)) && <a href={getSafeHttpUrl(currentLesson.videoUrl)!} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#153b77] underline">Mở video trong tab mới</a>}
                  {currentLesson.content && <div className="rounded-xl bg-[#f8fafd] p-5"><h4 className="mb-3 font-bold">Nội dung bài học</h4><p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{currentLesson.content}</p></div>}
                  {getResourceLinks(currentLesson.content).length > 0 && <div><h4 className="mb-3 font-bold">Tài liệu tham khảo</h4><ul className="space-y-2">{getResourceLinks(currentLesson.content).map(link => <li key={link}><a className="break-all text-sm font-semibold text-[#153b77] underline" href={link} target="_blank" rel="noreferrer">{link}</a></li>)}</ul></div>}
                  {focusMode && user.role === 'STUDENT' && <button type="button" onClick={() => setFocusStep('practice')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">Tôi đã học xong · Đến luyện tập <ArrowRight size={16} aria-hidden="true"/></button>}
                  </div>
                  <div id="quest-task-practice" role="region" aria-label="Luyện tập và nhận phản hồi" tabIndex={-1} className={focusMode && focusStep !== "practice" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5"}>
                  {(!focusMode || focusStep === 'practice' || canEditCourse) && <LessonPractice key={currentLesson.id} lessonId={currentLesson.id} courseId={course.id} token={token} canManage={canEditCourse} isEnrolled={isEnrolled}/>}
                  {focusMode && focusStep === 'practice' && user.role === 'STUDENT' && <button type="button" onClick={() => setFocusStep('apply')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">Đến nhiệm vụ vận dụng <ArrowRight size={16} aria-hidden="true"/></button>}
                  </div>
                  <div id="quest-task-apply" role="region" aria-label="Vận dụng vào dự án" tabIndex={-1} className={focusMode && focusStep !== "apply" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5"}>
                  <DesignThinkingLessonGuide key={currentLesson.id} title={currentLesson.title} courseId={course.id}/>
                  <div className="mt-4 grid gap-3 rounded-[22px] border border-[#cbded1] bg-[#eaf5e7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#a64c35]">LEARN TOGETHER · PROJECT CONVERSATION</p>
                      <h4 className="mt-1 text-lg font-black text-[#173445]">Học cùng nhóm. Hỏi giảng viên khi cần.</h4>
                      <p className="mt-2 text-xs leading-6 text-[#4e696c]">Trao đổi riêng trong dự án nhóm; giảng viên xem và phản hồi theo quyền. Hoặc ghé cộng đồng để xem và góp ý các dự án đã duyệt.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={"/studio?course="+encodeURIComponent(course.id)+"&mode="+(findKitLesson(currentLesson.title)?.mode||"EMPATHIZE")+"#project-discussion"}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-4 text-xs font-black text-white">Trao đổi với giảng viên <ArrowRight size={16}/></Link>
                      <Link href="/community" className="inline-flex min-h-11 items-center rounded-full border border-[#a8cbc0] bg-white px-4 text-xs font-black text-[#173445]">Xem cộng đồng</Link>
                    </div>
                  </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                    <div className="flex flex-wrap gap-2">{selectedLessonIndex > 0 && <button type="button" onClick={() => openLesson(lessons[selectedLessonIndex-1])} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><ArrowLeft size={16}/> Bài trước</button>}{selectedLessonIndex < lessons.length-1 && <button type="button" onClick={() => openLesson(lessons[selectedLessonIndex+1])} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">Bài tiếp theo <ArrowRight size={16}/></button>}</div>
                    {user.role === 'STUDENT' && isEnrolled && <button type="button" disabled={busy} onClick={() => void toggleProgress(currentLesson)} className={"min-h-11 rounded-xl px-5 text-sm font-bold "+(completed.has(currentLesson.id)?'border border-emerald-300 bg-emerald-50 text-emerald-800':'bg-[#b94708] text-white')}>{completed.has(currentLesson.id) ? '✓ Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button>}
                  </div>
                </article>
              </div>
            </section>}
            {canEditCourse && <section id="lesson-editor" className="scroll-mt-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">LECTURER WORKSPACE</p><h3 className="mt-1 text-xl font-extrabold">{editingLessonId ? 'Chỉnh sửa bài học' : 'Biên soạn bài học mới'}</h3><p className="mt-1 text-sm text-slate-600">Nội dung giảng dạy chỉ được chỉnh sửa bởi người có quyền quản lý khóa học.</p></div>
              <form onSubmit={event => void createLesson(event)} className="space-y-4">
                <label htmlFor="lesson-starter-template" className="block text-sm font-semibold">Mẫu bài học Design Thinking (không bắt buộc)</label>
                <select id="lesson-starter-template" defaultValue="" onChange={event => {
                  const kit = DESIGN_THINKING_KIT.find(item => item.mode === event.target.value);
                  if (!kit) return;
                  setLessonTitle(kit.title); setLessonContent(kit.content); setLessonType('WORKSHOP'); setLessonVideoUrl('');
                }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
                  <option value="">Bắt đầu từ trang trống</option>
                  {DESIGN_THINKING_KIT.map(item => <option key={item.mode} value={item.mode}>{item.title}</option>)}
                </select>
                <p className="text-xs leading-5 text-slate-600">Chèn nội dung gốc vào trình biên soạn, có thể sửa trước khi lưu. Quiz riêng được tạo trong mục Luyện tập ở bài học.</p>
                <label htmlFor="lesson-title" className="block text-sm font-semibold">Tiêu đề bài học</label>
                <input id="lesson-title" required maxLength={160} value={lessonTitle} onChange={event => setLessonTitle(event.target.value)} className="min-h-11 w-full rounded-xl border px-3 text-base"/>
                <label htmlFor="lesson-type" className="block text-sm font-semibold">Loại bài học</label>
                <select id="lesson-type" value={lessonType} onChange={event => setLessonType(event.target.value as NonNullable<Lesson['contentType']>)} className="min-h-11 w-full rounded-xl border bg-white px-3 text-base"><option value="ARTICLE">Bài đọc</option><option value="VIDEO">Video</option><option value="WORKSHOP">Workshop</option><option value="TEMPLATE">Template</option><option value="ASSIGNMENT">Bài tập</option></select>
                {(lessonType==='VIDEO'||lessonVideoUrl) && <><label htmlFor="lesson-video" className="block text-sm font-semibold">Video bài học</label><input id="lesson-video" type="url" placeholder="Link video YouTube (https://...)" value={lessonVideoUrl} onChange={event=>setLessonVideoUrl(event.target.value)} className="min-h-11 w-full rounded-xl border px-3 text-base"/></>}
                <label htmlFor="lesson-content" className="block text-sm font-semibold">Nội dung bài học</label>
                <textarea id="lesson-content" required rows={7} maxLength={10000} value={lessonContent} onChange={event => setLessonContent(event.target.value)} className="w-full rounded-xl border px-3 py-3 text-base"/>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonPublished} onChange={event=>setLessonPublished(event.target.checked)}/> Công bố bài học khi tạo</label>
                <div className="flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-xl bg-[#153b77] px-5 text-sm font-bold text-white disabled:opacity-50">Lưu bài học</button>{editingLessonId && <button type="button" disabled={busy} onClick={()=>{setEditingLessonId(null);setLessonTitle('');setLessonContent('');setLessonVideoUrl('');setLessonType('ARTICLE');setLessonPublished(true);}} className="min-h-11 rounded-xl border px-5 text-sm font-semibold">Hủy chỉnh sửa</button>}</div>
              </form>
            </section>}
          </>}
          <p className="border-t pt-6 text-center text-xs text-slate-500">UII Design Thinking Hub · Học, thực hành và cải tiến dựa trên minh chứng.</p>
        </>}
      </main>
    </div>
  );
}
