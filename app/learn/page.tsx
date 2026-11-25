'use client';

import Link from 'next/link';
import { LearningAuthForm } from '@/components/learning-auth-form';
import { WorkspaceLoading } from '@/components/workspace-loading';
import { WorkspaceNav } from '@/components/workspace-nav';
import { LessonPractice } from '@/components/lesson-practice';
import { LearningQuestCompass, type FocusStep } from '@/components/learning-quest-compass';
import { StudentNextAction } from '@/components/student-next-action';
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
        if (active) { setError(err instanceof Error ? err.message : 'Unable to read the sign-in session.'); setAuthReady(true); }
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
      setMessage('Successfully enrolled.');
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
      setMessage('Course draft created.');
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
          description: 'A guided course covering five Design Thinking stages. Each lesson includes key concepts, applied work, a quiz, and outputs for Design Studio. Created as a draft for lecturer review before publishing.',
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
            kind: 'QUIZ', title: 'Knowledge check · ' + kit.mode,
            instructions: 'Answer the questions, review the explanation, and return to your practice task.',
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
      setMessage('Draft course created with five activities and five quizzes. Review every lesson before publishing.');
    } catch (err) {
      if (newCourse) {
        await selectCourse(newCourse.id);
        setError('Course creation incomplete (' + lessonsCreated + '/5 lessons, ' + quizzesCreated + '/5 quizzes). Partial data remains on the server. Inspect the draft instead of creating a duplicate. Details: ' + (err instanceof Error ? err.message : 'Unknown error.'));
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
      setMessage('Course published.');
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
      setMessage('Lesson saved.');
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
      setMessage('Lesson published.');
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
      setMessage(wasCompleted ? 'Lesson marked incomplete.' : 'Progress saved to the server.');
    } catch (err) { fail(err); } finally { setBusy(false); }
  }

  return (
    <div className="uii-workspace min-h-screen bg-[#f5f7fb] text-[#12284a]">
      <WorkspaceNav title="Courses" role={user?.role} guest={!session} onSignOut={session ? () => void getSupabaseBrowserClient().auth.signOut() : undefined} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1320px] space-y-7 px-4 py-7 sm:px-7 lg:px-9">
        {error && <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="shrink-0"/><span>{error}</span></div>}
        {message && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
        {!authReady && <WorkspaceLoading label="Checking sign-in session…"/>}
        {authReady && !session && <LearningAuthForm />}
        {session && !user && busy && <WorkspaceLoading label="Verifying your account…"/>}
        {session && !user && error && !busy && <button type="button" onClick={() => setReload(n => n + 1)} className="min-h-11 rounded-xl border bg-white px-4 font-semibold">Retry</button>}
        {session && user && <>
          <section className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-[30px] border border-[#b1e0e8] bg-[#bdeaf4] p-6 sm:p-9">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#b94708]">UII · LEARNING EXPERIENCE</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">Learning Hub</h1>
              <p className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#b5362a]">Try, learn, try again.</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{canTeach ? 'Design and manage hands-on learning experiences.' : 'Explore new concepts, learn at your own pace, and apply them to real projects.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">{user.role === 'STUDENT' ? 'Student' : user.role === 'LECTURER' ? 'Lecturer' : user.role === 'ADMIN' ? 'Administrator' : 'Mentor'}</span>
            </div>
          </section>

          {user.role === 'STUDENT' && <section aria-labelledby="learning-path-title" className="overflow-hidden rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#153b77]"><GraduationCap size={27} aria-hidden="true"/></div>
              <div className="min-w-0 flex-1">
                <h2 id="learning-path-title" className="text-xl font-extrabold">{enrollments.length ? 'Continue your learning journey' : 'Start your Design Thinking journey'}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Explore courses, learn through examples, and practise Design Thinking with your team.</p>
              </div>
              <a href="#course-catalog" onClick={() => setCatalogView(enrollments.length ? 'enrolled' : 'all')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-5 py-3 text-sm font-bold text-white hover:bg-[#214d8a]">{enrollments.length ? 'View my courses' : 'Explore courses'} <ArrowRight size={16}/></a>
            </div>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              <li className="rounded-xl bg-blue-50 p-3 text-sm"><strong className="block">01 · Discover</strong><span className="text-slate-600">Choose a course and enroll.</span></li>
              <li className="rounded-xl bg-orange-50 p-3 text-sm"><strong className="block">02 · Learn & Practise</strong><span className="text-slate-600">Study lessons and save progress.</span></li>
              <li className="rounded-xl bg-emerald-50 p-3 text-sm"><strong className="block">03 · Apply</strong><span className="text-slate-600">Complete a challenge with your team.</span></li>
            </ol>
          </section>}

          <section id="course-catalog" className="scroll-mt-4 space-y-4" aria-labelledby="course-catalog-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#ad4007]">COURSE CATALOG</p><h2 id="course-catalog-title" className="mt-1 text-2xl font-extrabold">Explore courses</h2><p className="mt-1 text-sm text-slate-600">Choose a learning pathway that suits you and learn at your own pace.</p></div>
              <button type="button" disabled={busy} onClick={() => void refreshData()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:border-blue-400"><RefreshCw size={16} aria-hidden="true"/> Refresh</button>
            </div>
            <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="min-w-[180px] flex-[2]">
                <label htmlFor="course-search" className="mb-1 block text-sm font-semibold">Find courses</label>
                <input id="course-search" type="search" value={courseSearch} onChange={event => setCourseSearch(event.target.value)} placeholder="Course title or topic…" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base focus:border-[#153b77]"/>
              </div>
              <div className="min-w-[145px] flex-1">
                <label htmlFor="course-level" className="mb-1 block text-sm font-semibold">Level</label>
                <select id="course-level" value={levelFilter} onChange={event => setLevelFilter(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base">
                  <option value="all">All levels</option>
                  {levels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              {user.role === 'STUDENT' && <div className="flex min-w-[175px] items-end gap-2" aria-label="Filter courses">
                <button type="button" aria-pressed={catalogView === 'all'} onClick={() => setCatalogView('all')} className={"min-h-11 rounded-xl border px-3 text-sm font-semibold " + (catalogView === 'all' ? 'border-[#153b77] bg-blue-50 text-[#153b77]' : 'text-slate-700')}>All</button>
                <button type="button" aria-pressed={catalogView === 'enrolled'} onClick={() => setCatalogView('enrolled')} className={"min-h-11 rounded-xl border px-3 text-sm font-semibold " + (catalogView === 'enrolled' ? 'border-[#153b77] bg-blue-50 text-[#153b77]' : 'text-slate-700')}>Enrolled ({enrollments.length})</button>
              </div>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((item, index) => {
                const joined = enrollments.find(record => record.courseId === item.id);
                return <button key={item.id} type="button" disabled={busy} onClick={() => void selectCourse(item.id, undefined, undefined, true)} aria-pressed={course?.id === item.id} className={"group overflow-hidden rounded-[22px] border bg-white text-left shadow-[0_6px_28px_rgba(20,42,78,0.05)] transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-4 focus-visible:outline-blue-600 " + (course?.id === item.id ? 'border-[#153b77] ring-2 ring-blue-100' : 'border-slate-200')}>
                  <div className="relative flex min-h-[170px] items-end overflow-hidden bg-[#a9dadd] p-5 text-white">
                    <DemoPhoto src={DEMO_COURSES[index % DEMO_COURSES.length].photo}
                      alt={"Illustration for Design Thinking course " + item.title}
                      tint={DEMO_COURSES[index % DEMO_COURSES.length].accent}
                      className="absolute inset-0 h-full w-full"/>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071f37]/80 via-[#1c4055]/20 to-transparent"/>
                    <div className="relative flex w-full items-end justify-between gap-3"><span className="rounded-lg bg-[#0d2a46]/65 px-3 py-1.5 text-xs font-bold backdrop-blur">UII · DESIGN THINKING</span><GraduationCap size={31} aria-hidden="true" className="text-white"/></div>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{item.level || 'Course'}</span><span className="text-xs text-slate-500">{item.status === 'PUBLISHED' ? 'Open' : item.status === 'DRAFT' ? 'Draft' : 'Archived'}</span></div>
                    <p className="line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#10284a]">{item.title}</p>
                    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{item.description || 'Explore human-centred design through hands-on activities.'}</p>
                    {item.createdBy?.fullName && <p className="text-xs text-slate-600">Lecturer: {item.createdBy.fullName}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-slate-600"><span>{item._count?.lessons != null ? item._count.lessons + ' lessons' : 'Learning pathway'}</span><span className="inline-flex items-center gap-1 font-bold text-[#153b77]">{joined ? 'Continue learning' : 'View course'} <ChevronRight size={15} aria-hidden="true"/></span></div>
                  </div>
                </button>;
              })}
            </div>
            {!visibleCourses.length && <div role="status" className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-600">{busy ? 'Loading courses…' : courseSearch || levelFilter !== 'all' ? 'No matching courses. Try a different search.' : catalogView === 'enrolled' ? 'You have not enrolled yet. Select All to explore courses.' : 'Courses will appear here after the lecturer publishes them.'}</div>}
          </section>

          {canTeach && <details className="rounded-2xl border bg-white p-5" id="course-authoring">
            <summary className="min-h-11 cursor-pointer text-lg font-bold">For lecturers · Create a course</summary>
            <p className="mt-3 text-sm text-[#5a726f]">Edit course details, level, status, and lesson duration in <Link href="/console" className="font-bold underline">Course Console</Link>.</p>
            <form onSubmit={event => void createCourse(event)} className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Course title<input required maxLength={160} value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="mt-2 min-h-11 w-full rounded-xl border px-3"/></label>
              <label className="block text-sm font-semibold">Course description<textarea maxLength={1200} value={courseDescription} onChange={e => setCourseDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-xl border px-3 py-2"/></label>
              <button disabled={busy} className="min-h-11 rounded-xl bg-[#153b77] px-5 font-bold text-white disabled:opacity-50">Create course draft</button>
            </form>
            <div className="mt-4 space-y-2 border-t pt-4">
              <h3 className="text-base font-extrabold">Starter learning kit · Design Thinking Foundations</h3>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">Create a <strong>draft</strong> course with five lessons for Empathize, Define, Ideate, Prototype, and Test. Each includes original reading, applied work, and an auto-graded quiz. Lessons are saved only when the lecturer confirms creation; the course is not published automatically.</p>
              <button type="button" disabled={busy} onClick={() => void createGuidedStarterCourse()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#153b77] px-4 py-3 text-sm font-extrabold text-[#153b77] hover:bg-blue-50 disabled:opacity-50"><Plus size={17} aria-hidden="true"/> Create five-lesson starter course + quizzes</button>
            </div>
          </details>}

          {!course ? <section className="rounded-2xl border border-dashed bg-white p-10 text-center"><BookOpen size={34} className="mx-auto text-[#153b77]"/><h2 className="mt-3 text-xl font-extrabold">Choose a course</h2><p className="mt-2 text-sm text-slate-600">Read the overview, explore the syllabus, and enroll to begin.</p></section> : <>
            <section id="course-detail" className="scroll-mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm" aria-labelledby="course-detail-title">
              <div className="border-b bg-[#f7f9fd] p-5 sm:p-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#153b77]">{course.status === 'PUBLISHED' ? 'Open for enrollment' : course.status === 'DRAFT' ? 'Draft' : 'Archived'}</span>
                  {canEditCourse && <Link href={"/console?course="+encodeURIComponent(course.id)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#b3d7c1] bg-white px-4 text-sm font-bold text-[#173445]">Edit course details & duration <ArrowRight size={16}/></Link>}
                  {canEditCourse && course.status === 'DRAFT' && <button type="button" disabled={busy} onClick={() => void publishCourse()} className="min-h-11 rounded-xl bg-[#b94708] px-5 text-sm font-bold text-white">Publish course</button>}
                  <button type="button" onClick={() => {setCourse(null); setLessons([]); setProgress(null); setLearningView('overview'); setActiveLessonId(null);}} className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 text-sm font-semibold text-[#153b77]"><X size={16} aria-hidden="true"/> Close details</button>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#ad4007]">COURSE OVERVIEW</p>
                <h2 id="course-detail-title" ref={courseHeading} tabIndex={-1} className="scroll-mt-4 mt-2 text-2xl font-extrabold outline-none focus-visible:outline sm:text-3xl">{course.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{course.description || 'The lecturer has not added a course description.'}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  {course.level && <span className="inline-flex items-center gap-2"><GraduationCap size={16} aria-hidden="true"/>{course.level}</span>}
                  {course.createdBy?.fullName && <span>Lecturer: {course.createdBy.fullName}</span>}
                  {lessons.length > 0 && <span className="inline-flex items-center gap-2"><BookOpen size={16} aria-hidden="true"/>{lessons.length} lessons available</span>}
                  {lessons.some(item => item.durationMinutes && item.durationMinutes > 0) && <span className="inline-flex items-center gap-2"><Clock3 size={16} aria-hidden="true"/>{lessons.reduce((total, item) => total + (item.durationMinutes ?? 0), 0)} minutes of timed content</span>}
                </div>
                {user.role === 'STUDENT' && learningView === 'overview' &&
                  <StudentNextAction
                    courseId={course.id} enrolled={isEnrolled} lessons={lessons}
                    completedIds={completed} progressPercent={progress?.percent ?? null}
                    busy={busy} onEnroll={() => void enroll()}
                    onOpenLesson={id => {const next = lessons.find(item => item.id === id); if (next) openLesson(next);}}
                  />
                }
              </div>
              {learningView === 'overview' && <div className="grid gap-7 p-5 lg:grid-cols-[minmax(0,1fr)_280px] sm:p-8">
                <div className="space-y-7">
                  <div><h3 className="text-xl font-extrabold">What will you learn?</h3><p className="mt-2 text-sm leading-7 text-slate-600">{course.description || 'Explore methods and practice activities guided by your lecturer.'}</p></div>
                  <div><h3 className="mb-4 text-xl font-extrabold">Course syllabus</h3>
                    <div className="space-y-3">
                      {lessons.map((lesson,index) => <div key={lesson.id} className="space-y-2">
                        {findKitLesson(lesson.title) && <h4 className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#153b77]"><span className="rounded-full bg-blue-50 px-3 py-1">CHAPTER {index+1} · {findKitLesson(lesson.title)!.mode}</span><span className="text-xs font-normal text-slate-600">{findKitLesson(lesson.title)!.objective}</span></h4>}
                        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#153b77]">{lesson.contentType === 'VIDEO' ? <PlayCircle size={20}/> : lesson.contentType === 'ASSIGNMENT' ? <ListChecks size={20}/> : <FileText size={20}/>}</span><div className="min-w-0"><p className="text-xs font-semibold text-[#b94708]">Lesson {index+1} · {lesson.contentType === 'VIDEO' ? 'Video' : lesson.contentType === 'WORKSHOP' ? 'Workshop' : lesson.contentType === 'ASSIGNMENT' ? 'Assignment' : 'Article'}</p><h4 className="mt-1 font-bold">{lesson.title}</h4>{lesson.description && <p className="mt-1 text-sm text-slate-600">{lesson.description}</p>}{lesson.durationMinutes ? <p className="mt-1 text-xs text-slate-600">{lesson.durationMinutes} min</p> : null}</div></div>
                        <div className="flex flex-wrap items-center gap-2">{completed.has(lesson.id) && <span className="text-xs font-bold text-emerald-700"><CheckCircle2 size={15} className="inline"/> Completed</span>}{(isEnrolled || canEditCourse || lesson.isPreview) && <button type="button" className="min-h-11 rounded-xl border border-blue-200 px-3 text-sm font-bold text-[#153b77]" onClick={() => openLesson(lesson)}>Open lesson</button>}{canEditCourse && <button type="button" disabled={busy} className="min-h-11 rounded-xl border px-3 text-sm font-semibold" onClick={() => {setEditingLessonId(lesson.id); setLessonTitle(lesson.title);setLessonContent(lesson.content??'');setLessonVideoUrl(lesson.videoUrl??'');setLessonType(lesson.contentType??'ARTICLE');setLessonPublished(!!lesson.publishedAt);document.getElementById('lesson-editor')?.scrollIntoView({behavior:'smooth',block:'start'});document.getElementById('lesson-title')?.focus({preventScroll:true});}}>Edit lesson</button>}{canEditCourse && !lesson.publishedAt && <button type="button" className="min-h-11 rounded-xl border px-3 text-sm font-semibold" disabled={busy} onClick={() => void publishLesson(lesson)}>Xuất bản lessons</button>}</div>
                        </div>
                      </div>)}
                      {lessons.length === 0 && <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">{isEnrolled || canEditCourse ? 'No lessons have been published for this course.' : 'Enroll to access course content. Preview lessons may appear here.'}</div>}
                    </div>
                  </div>
                </div>
                <aside className="self-start rounded-2xl bg-[#edf3fa] p-5">
                  <h3 className="font-extrabold">Learn with UII</h3><p className="mt-2 text-sm leading-6 text-slate-600">Learn a method, practise it, and improve through feedback.</p>
                  <ol className="mt-4 space-y-3 text-sm text-slate-700"><li>1. Read lessons and take notes</li><li>2. Complete lessons at your own pace</li><li>3. Apply the method to your project</li></ol>
                  <Link href="/studio" className="mt-5 inline-flex min-h-11 items-center gap-1 font-bold text-[#153b77] underline">Explore Design Studio <ArrowRight size={16}/></Link>
                </aside>
              </div>}
            </section>
            {learningView === 'player' && currentLesson && <section id="lesson-player" className="scroll-mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm" aria-label="Lesson player">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 p-4">
                <button type="button" onClick={() => {setLearningView('overview'); setActiveLessonId(null);window.history.replaceState(window.history.state,'','/learn?course='+encodeURIComponent(course.id));}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-bold"><ArrowLeft size={17}/> Course syllabus</button>
                <span className="text-sm font-semibold text-slate-600">Lesson {selectedLessonIndex+1}/{lessons.length}</span>
              </div>
              <div className={focusMode && user.role === "STUDENT" ? "grid" : "grid lg:grid-cols-[260px_minmax(0,1fr)]"}>
                <aside className={focusMode && user.role === "STUDENT" ? "hidden" : "border-b border-slate-200 bg-[#f8fafd] p-4 lg:border-b-0 lg:border-r"} aria-label="Lesson list">
                  <h3 className="mb-3 font-extrabold">Course content</h3>
                  <div className="space-y-2">{lessons.map((lesson,index) => <button key={lesson.id} type="button" aria-current={currentLesson.id===lesson.id?'step':undefined} onClick={() => openLesson(lesson)} className={"flex min-h-11 w-full items-start gap-2 rounded-xl border px-3 py-3 text-left text-sm "+(currentLesson.id===lesson.id?'border-[#153b77] bg-blue-50 font-bold text-[#153b77]':'border-transparent hover:border-slate-200 hover:bg-white')}><span>{index+1}.</span><span className="min-w-0 flex-1">{lesson.title}{completed.has(lesson.id) && <span className="mt-1 block text-xs text-emerald-700">✓ Completed</span>}</span></button>)}</div>
                </aside>
                <article className="min-w-0 space-y-6 p-5 sm:p-8">
                  <div><p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">LEARNING PLAYER</p><h3 id="lesson-player-title" tabIndex={-1} className="mt-2 text-2xl font-extrabold outline-none focus-visible:outline sm:text-3xl">{currentLesson.title}</h3>{currentLesson.description && <p className="mt-2 text-sm leading-7 text-slate-600">{currentLesson.description}</p>}</div>
                  {user.role === 'STUDENT' && isEnrolled && <LearningQuestCompass
                    key={course.id} courseId={course.id} userId={user.id} token={token}
                    lessonCompleted={completed.has(currentLesson.id)}
                    focusMode={focusMode} focusStep={focusStep}
                    onFocusModeChange={setFocusMode} onFocusStepChange={setFocusStep}
                  />}
                  <div id="quest-task-learn" role="region" aria-label="Study lesson content" tabIndex={-1} className={focusMode && focusStep !== "learn" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5 space-y-6"}>
                  {getYouTubeEmbedUrl(currentLesson.videoUrl) && <div className="aspect-video overflow-hidden rounded-2xl bg-slate-950"><iframe title={'Video lessons: '+currentLesson.title} src={getYouTubeEmbedUrl(currentLesson.videoUrl)!} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" allowFullScreen/></div>}
                  {currentLesson.videoUrl && !getYouTubeEmbedUrl(currentLesson.videoUrl) && getSafeHttpUrl(currentLesson.videoUrl) && (/\.(mp4|webm)(\?|#|$)/i.test(currentLesson.videoUrl)) && <video className="aspect-video w-full rounded-2xl bg-black" controls preload="metadata" src={getSafeHttpUrl(currentLesson.videoUrl)!}>Your browser cannot play this video.</video>}
                  {currentLesson.videoUrl && !getYouTubeEmbedUrl(currentLesson.videoUrl) && getSafeHttpUrl(currentLesson.videoUrl) && !(/\.(mp4|webm)(\?|#|$)/i.test(currentLesson.videoUrl)) && <a href={getSafeHttpUrl(currentLesson.videoUrl)!} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#153b77] underline">Open video in a new tab</a>}
                  {currentLesson.content && <div className="rounded-xl bg-[#f8fafd] p-5"><h4 className="mb-3 font-bold">Lesson content</h4><p className="whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{currentLesson.content}</p></div>}
                  {getResourceLinks(currentLesson.content).length > 0 && <div><h4 className="mb-3 font-bold">References</h4><ul className="space-y-2">{getResourceLinks(currentLesson.content).map(link => <li key={link}><a className="break-all text-sm font-semibold text-[#153b77] underline" href={link} target="_blank" rel="noreferrer">{link}</a></li>)}</ul></div>}
                  {focusMode && user.role === 'STUDENT' && <button type="button" onClick={() => setFocusStep('practice')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">I've finished reading · Go to practice <ArrowRight size={16} aria-hidden="true"/></button>}
                  </div>
                  <div id="quest-task-practice" role="region" aria-label="Practise and get feedback" tabIndex={-1} className={focusMode && focusStep !== "practice" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5"}>
                  {(!focusMode || focusStep === 'practice' || canEditCourse) && <LessonPractice key={currentLesson.id} lessonId={currentLesson.id} courseId={course.id} token={token} canManage={canEditCourse} isEnrolled={isEnrolled}/>}
                  {focusMode && focusStep === 'practice' && user.role === 'STUDENT' && <button type="button" onClick={() => setFocusStep('apply')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">Continue to the applied task <ArrowRight size={16} aria-hidden="true"/></button>}
                  </div>
                  <div id="quest-task-apply" role="region" aria-label="Apply to your project" tabIndex={-1} className={focusMode && focusStep !== "apply" && user.role === "STUDENT" ? "hidden" : "scroll-mt-5"}>
                  <DesignThinkingLessonGuide key={currentLesson.id} title={currentLesson.title} courseId={course.id}/>
                  <div className="mt-4 grid gap-3 rounded-[22px] border border-[#cbded1] bg-[#eaf5e7] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#a64c35]">LEARN TOGETHER · PROJECT CONVERSATION</p>
                      <h4 className="mt-1 text-lg font-black text-[#173445]">Learn with your team. Ask your lecturer when needed.</h4>
                      <p className="mt-2 text-xs leading-6 text-[#4e696c]">Discuss privately in your team project; authorized lecturers can review and reply. Or visit Community to explore approved projects.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={"/studio?course="+encodeURIComponent(course.id)+"&mode="+(findKitLesson(currentLesson.title)?.mode||"EMPATHIZE")+"#project-discussion"}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-4 text-xs font-black text-white">Message your lecturer <ArrowRight size={16}/></Link>
                      <Link href="/community" className="inline-flex min-h-11 items-center rounded-full border border-[#a8cbc0] bg-white px-4 text-xs font-black text-[#173445]">Explore Community</Link>
                    </div>
                  </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
                    <div className="flex flex-wrap gap-2">{selectedLessonIndex > 0 && <button type="button" onClick={() => openLesson(lessons[selectedLessonIndex-1])} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"><ArrowLeft size={16}/> Previous lesson</button>}{selectedLessonIndex < lessons.length-1 && <button type="button" onClick={() => openLesson(lessons[selectedLessonIndex+1])} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">Next lesson <ArrowRight size={16}/></button>}</div>
                    {user.role === 'STUDENT' && isEnrolled && <button type="button" disabled={busy} onClick={() => void toggleProgress(currentLesson)} className={"min-h-11 rounded-xl px-5 text-sm font-bold "+(completed.has(currentLesson.id)?'border border-emerald-300 bg-emerald-50 text-emerald-800':'bg-[#b94708] text-white')}>{completed.has(currentLesson.id) ? '✓ Completed' : 'Mark complete'}</button>}
                  </div>
                </article>
              </div>
            </section>}
            {canEditCourse && <section id="lesson-editor" className="scroll-mt-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-widest text-[#ad4007]">LECTURER WORKSPACE</p><h3 className="mt-1 text-xl font-extrabold">{editingLessonId ? 'Edit lesson' : 'Create new lesson'}</h3><p className="mt-1 text-sm text-slate-600">Only authorized course managers may edit teaching materials.</p></div>
              <form onSubmit={event => void createLesson(event)} className="space-y-4">
                <label htmlFor="lesson-starter-template" className="block text-sm font-semibold">Design Thinking lesson template (optional)</label>
                <select id="lesson-starter-template" defaultValue="" onChange={event => {
                  const kit = DESIGN_THINKING_KIT.find(item => item.mode === event.target.value);
                  if (!kit) return;
                  setLessonTitle(kit.title); setLessonContent(kit.content); setLessonType('WORKSHOP'); setLessonVideoUrl('');
                }} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
                  <option value="">Start with a blank lesson</option>
                  {DESIGN_THINKING_KIT.map(item => <option key={item.mode} value={item.mode}>{item.title}</option>)}
                </select>
                <p className="text-xs leading-5 text-slate-600">Insert sample content and edit before saving. Create quizzes separately in the lesson Practice section.</p>
                <label htmlFor="lesson-title" className="block text-sm font-semibold">Lesson title</label>
                <input id="lesson-title" required maxLength={160} value={lessonTitle} onChange={event => setLessonTitle(event.target.value)} className="min-h-11 w-full rounded-xl border px-3 text-base"/>
                <label htmlFor="lesson-type" className="block text-sm font-semibold">Lesson type</label>
                <select id="lesson-type" value={lessonType} onChange={event => setLessonType(event.target.value as NonNullable<Lesson['contentType']>)} className="min-h-11 w-full rounded-xl border bg-white px-3 text-base"><option value="ARTICLE">Article</option><option value="VIDEO">Video</option><option value="WORKSHOP">Workshop</option><option value="TEMPLATE">Template</option><option value="ASSIGNMENT">Assignment</option></select>
                {(lessonType==='VIDEO'||lessonVideoUrl) && <><label htmlFor="lesson-video" className="block text-sm font-semibold">Video lessons</label><input id="lesson-video" type="url" placeholder="Video link YouTube (https://...)" value={lessonVideoUrl} onChange={event=>setLessonVideoUrl(event.target.value)} className="min-h-11 w-full rounded-xl border px-3 text-base"/></>}
                <label htmlFor="lesson-content" className="block text-sm font-semibold">Lesson content</label>
                <textarea id="lesson-content" required rows={7} maxLength={10000} value={lessonContent} onChange={event => setLessonContent(event.target.value)} className="w-full rounded-xl border px-3 py-3 text-base"/>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonPublished} onChange={event=>setLessonPublished(event.target.checked)}/> Publish lesson on creation</label>
                <div className="flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-xl bg-[#153b77] px-5 text-sm font-bold text-white disabled:opacity-50">Save lesson</button>{editingLessonId && <button type="button" disabled={busy} onClick={()=>{setEditingLessonId(null);setLessonTitle('');setLessonContent('');setLessonVideoUrl('');setLessonType('ARTICLE');setLessonPublished(true);}} className="min-h-11 rounded-xl border px-5 text-sm font-semibold">Cancel editing</button>}</div>
              </form>
            </section>}
          </>}
          <p className="border-t pt-6 text-center text-xs text-slate-500">UII Design Thinking Hub · Learn, practise, and improve using evidence.</p>
        </>}
      </main>
    </div>
  );
}
