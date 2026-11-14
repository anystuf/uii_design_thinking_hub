'use client';

import Link from 'next/link';
import { WorkspaceNav } from '@/components/workspace-nav';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, CheckCircle2, ClipboardCheck, FileText,
  LoaderCircle, Plus, Send, ShieldCheck,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { authenticatedApi } from '@/lib/authenticated-api';
import { withAuthDeadline } from '@/lib/auth-timeout';

type User = { id: string; fullName: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR' };
type Course = { id: string; title: string; createdById: string };
type Challenge = { id: string; title: string; courseId: string; status: string };
type Criterion = { id: string; title: string; description?: string | null; weight: number; maxScore: number; orderIndex: number };
type RubricVersion = { id: string; version: number; status: 'DRAFT' | 'PUBLISHED'; criteria: Criterion[] };
type Rubric = { id: string; title: string; milestoneId?: string | null; challengeId: string; versions: RubricVersion[] };
type Submission = {
  id: string; projectId: string; status: string; milestoneId?: string | null;
  scopeKey: string; version: number; submittedAt: string;
  project: { id: string; title: string; challengeId?: string | null; courseId: string };
  submittedBy: { id: string; fullName: string };
  milestone?: { id: string; title: string } | null;
};
type SubmissionDetail = {
  id: string; projectId: string; version: number;
  items: { id: string; evidenceVersion: {
    id: string; title: string; description?: string | null; reflection?: string | null;
    version: number; fileAsset?: { id: string; fileName: string } | null;
  } }[];
};
type CriterionDraft = { title: string; description: string; weight: number; maxScore: number };
type Rating = { criterionId: string; score: number; comment?: string };
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const field = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-[#f37021]';
const primary = 'rounded-xl bg-[#153b77] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const minor = 'rounded-xl border px-3 py-2 text-sm font-semibold text-[#153b77] disabled:opacity-50';

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return authenticatedApi<T>(path, token, init);
}

const initialCriteria: CriterionDraft[] = [
  { title: 'Thấu hiểu người dùng', description: 'Dẫn chứng phỏng vấn và quan sát', weight: 30, maxScore: 4 },
  { title: 'Tổng hợp insight', description: 'POV và HMW dựa trên evidence', weight: 25, maxScore: 4 },
  { title: 'Thử nghiệm và cải tiến', description: 'Prototype, kết quả test và iteration', weight: 30, maxScore: 4 },
  { title: 'Truyền đạt thiết kế', description: 'Rõ ràng, có logic và truy xuất minh chứng', weight: 15, maxScore: 4 },
];

export default function ReviewPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [account, setAccount] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeId, setChallengeId] = useState('');
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [rubricTitle, setRubricTitle] = useState('');
  const [draftCriteria, setDraftCriteria] = useState<CriterionDraft[]>(initialCriteria);
  const [selectedDraft, setSelectedDraft] = useState<{ rubricId: string; versionId: string } | null>(null);
  const [queue, setQueue] = useState<Submission[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [details, setDetails] = useState<SubmissionDetail | null>(null);
  const [rubricVersionId, setRubricVersionId] = useState('');
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [decision, setDecision] = useState<'APPROVED' | 'REVISION_REQUESTED'>('REVISION_REQUESTED');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const token = session?.access_token ?? '';
  const isReviewer = account?.role === 'LECTURER' || account?.role === 'ADMIN';
  const activeVersion = rubrics.flatMap((r) => r.versions).find((v) => v.id === rubricVersionId);
  const eligible = rubrics.filter((r) => !r.milestoneId || r.milestoneId === submission?.milestoneId)
    .flatMap((r) => r.versions.filter((v) => v.status === 'PUBLISHED')
      .map((v) => ({ ...v, label: r.title + ' · v' + v.version })));

  useEffect(() => {
    let active = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void withAuthDeadline(() => auth.getSession()).then(({ data }) => { if (active) { setSession(data.session); setAuthReady(true); } }).catch((err: unknown) => { setError(err instanceof Error ? err.message : 'Không đọc được phiên đăng nhập.'); setAuthReady(true); });
      const { data: { subscription } } = auth.onAuthStateChange((_event, s) => { if (active) setSession(s); });
      return () => { active = false; subscription.unsubscribe(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication configuration missing.');
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!token) { setAccount(null); setQueue([]); setCourses([]); return; }
    let active = true;
    void (async () => {
      setBusy(true);
      try {
        const [me, list] = await Promise.all([
          api<User>(token, '/auth/me'), api<Course[]>(token, '/courses'),
        ]);
        if (!active) return;
        setAccount(me); setCourses(list);
        if (me.role === 'LECTURER' || me.role === 'ADMIN') {
          setQueue(await api<Submission[]>(token, '/assessments/queue'));
          setCourseId((old) => list.some((c) => c.id === old) ? old : list.find((c) => c.createdById === me.id)?.id ?? list[0]?.id ?? '');
        }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'Unable to load review data.'); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !courseId || !isReviewer) { setChallenges([]); return; }
    let active = true;
    void api<Challenge[]>(token, '/courses/' + courseId + '/challenges')
      .then((list) => {
        if (!active) return;
        setChallenges(list);
        setChallengeId((id) => list.some((c) => c.id === id) ? id : list[0]?.id ?? '');
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Challenge loading failed.'); });
    return () => { active = false; };
  }, [token, courseId, isReviewer]);

  useEffect(() => {
    if (!token || !challengeId) { setRubrics([]); return; }
    let active = true;
    void api<Rubric[]>(token, '/challenges/' + challengeId + '/rubrics')
      .then((list) => { if (active) setRubrics(list); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Rubric request failed.'); });
    return () => { active = false; };
  }, [token, challengeId]);

  function reset() { setError(''); setMessage(''); }
  function fail(err: unknown) { setError(err instanceof Error ? err.message : 'Request failed.'); }
  async function run(fn: () => Promise<void>) {
    reset(); setBusy(true);
    try { await fn(); } catch (err) { fail(err); } finally { setBusy(false); }
  }
  async function loadRubrics(id = challengeId) {
    if (id) setRubrics(await api<Rubric[]>(token, '/challenges/' + id + '/rubrics'));
  }

  async function createRubric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!challengeId) return;
    await run(async () => {
      const created = await api<Rubric>(token, '/challenges/' + challengeId + '/rubrics', {
        method: 'POST', body: JSON.stringify({ title: rubricTitle }),
      });
      setRubricTitle('');
      await loadRubrics();
      setDraftCriteria(initialCriteria);
      setSelectedDraft({ rubricId: created.id, versionId: created.versions[0].id });
      setMessage('Đã tạo rubric draft. Hãy lưu các tiêu chí rồi publish.');
    });
  }

  function editCriterion(index: number, patch: Partial<CriterionDraft>) {
    setDraftCriteria((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  }
  function chooseDraft(rubricId: string, version: RubricVersion) {
    setSelectedDraft({ rubricId, versionId: version.id });
    setDraftCriteria(version.criteria.map((c) => ({
      title: c.title, description: c.description ?? '', weight: c.weight, maxScore: c.maxScore,
    })));
  }

  async function storeDraft() {
    if (!selectedDraft) return;
    await run(async () => {
      await api(token, '/rubric-versions/' + selectedDraft.versionId + '/criteria', {
        method: 'PUT', body: JSON.stringify({ criteria: draftCriteria }),
      });
      await loadRubrics();
      setMessage('Đã lưu draft rubric vào database.');
    });
  }

  async function publishRubric() {
    if (!selectedDraft) return;
    await run(async () => {
      await api(token, '/rubric-versions/' + selectedDraft.versionId + '/criteria', {
        method: 'PUT', body: JSON.stringify({ criteria: draftCriteria }),
      });
      await api(token, '/rubric-versions/' + selectedDraft.versionId + '/publish', { method: 'POST' });
      setSelectedDraft(null); await loadRubrics();
      setMessage('Rubric đã xuất bản và bất biến theo phiên bản.');
    });
  }

  async function nextVersion(rubricId: string) {
    await run(async () => {
      const created = await api<RubricVersion>(token, '/rubrics/' + rubricId + '/versions', { method: 'POST' });
      await loadRubrics(); chooseDraft(rubricId, created);
      setMessage('Đã tạo bản draft mới từ rubric trước đó.');
    });
  }

  async function selectSubmission(item: Submission) {
    await run(async () => {
      setSubmission(item);
      setDetails(await api<SubmissionDetail>(token, '/snapshot-submissions/' + item.id));
      const rows = await api<Rubric[]>(token, '/challenges/' + item.project.challengeId + '/rubrics');
      setRubrics(rows);
      setRubricVersionId('');
      setRatings({}); setFeedback(''); setDecision('REVISION_REQUESTED');
    });
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!submission || !activeVersion) return;
    const scores = activeVersion.criteria.map((c) => ratings[c.id] ?? { criterionId: c.id, score: 0 });
    await run(async () => {
      const result = await api<{ totalScore: number }>(token, '/snapshot-submissions/' + submission.id + '/assessment', {
        method: 'POST',
        body: JSON.stringify({ rubricVersionId, scores, decision, feedback }),
      });
      setMessage('Đã công bố review (' + result.totalScore + '/100). Đã tạo thông báo cho nhóm.');
      setQueue(await api<Submission[]>(token, '/assessments/queue'));
      setSubmission(null); setDetails(null); setRubricVersionId(''); setRatings({});
    });
  }

  async function openFile(id: string) {
    await run(async () => {
      const file = await api<{ signedUrl: string }>(token, '/file-assets/' + id + '/download');
      window.open(file.signedUrl, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <WorkspaceNav title="Đánh giá bài nộp" role={account?.role} />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#ad4007]">Phản hồi giúp nhóm tiến bộ</p>
          <h2 className="text-3xl font-extrabold">Review & Rubric Assessment</h2>
          <p className="mt-1 text-sm text-slate-600">{account?.fullName ?? 'Authorizing reviewer'} · {account?.role ?? ''}</p>
        </div>
        {busy && <p className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle size={16} className="animate-spin"/> Đang xử lý…</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}
        {authReady && !session && <section className={panel}>Bạn cần <Link href="/learn" className="font-bold underline">đăng nhập</Link> trước.</section>}
        {session && account && !isReviewer && <section className={panel}>Trang này chỉ dành cho Lecturer/Admin. Sinh viên xem đánh giá trong <Link className="font-bold underline" href="/evidence">Evidence & Submissions</Link>.</section>}
        {isReviewer && (
          <div className="grid gap-5 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className={panel}>
                <h3 className="mb-3 text-lg font-bold">Chọn khóa học / challenge</h3>
                <select aria-label="Course" className={field} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select aria-label="Challenge" className={field + ' mt-3'} value={challengeId} onChange={(e) => setChallengeId(e.target.value)}>
                  {challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </section>
              <section className={panel + ' space-y-3'}>
                <h3 className="text-lg font-bold">Rubric Library</h3>
                {rubrics.map((r) => (
                  <div key={r.id} className="rounded-xl border p-3">
                    <h4 className="font-bold">{r.title}</h4>
                    <div className="mt-2 space-y-2">
                      {r.versions.map((v) => (
                        <div key={v.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs">v{v.version} · {v.status} · {v.criteria.length} criteria</span>
                          {v.status === 'DRAFT' ?
                            <button type="button" className={minor} onClick={() => chooseDraft(r.id, v)}>Sửa</button>
                            : <button type="button" className={minor} onClick={() => void nextVersion(r.id)}>Clone v{v.version + 1}</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {challengeId && <form onSubmit={(e) => void createRubric(e)} className="space-y-3 border-t pt-4">
                  <label className="block text-sm font-semibold">Tên rubric
                    <input required maxLength={160} className={field + ' mt-2'} value={rubricTitle}
                      placeholder="Design Thinking Project Assessment" onChange={(e) => setRubricTitle(e.target.value)}/>
                  </label>
                  <button className={primary} disabled={busy}><Plus size={15} className="mr-1 inline"/> Tạo rubric</button>
                </form>}
              </section>
              <section className={panel}>
                <h3 className="mb-3 text-lg font-bold">Pending Reviews ({queue.length})</h3>
                <div className="space-y-2">
                  {queue.map((item) => (
                    <button key={item.id} onClick={() => void selectSubmission(item)}
                      className={'w-full rounded-xl border p-3 text-left hover:border-[#153b77] ' + (submission?.id === item.id ? 'border-[#153b77] bg-[#eef3fb]' : 'bg-white')}>
                      <span className="block font-semibold">{item.project.title} · v{item.version}</span>
                      <span className="mt-1 block text-xs text-slate-600">{item.submittedBy.fullName} · {new Date(item.submittedAt).toLocaleString('vi-VN')}</span>
                    </button>
                  ))}
                  {!queue.length && <p className="text-sm text-slate-600">Không có submission nào đang chờ đánh giá.</p>}
                </div>
              </section>
            </aside>
            <div className="space-y-5">
              {selectedDraft && (
                <section className={panel + ' space-y-4'}>
                  <h3 className="text-xl font-bold">Rubric draft editor</h3>
                  <p className="text-sm text-slate-600">Tổng trọng số phải bằng 100%. Published rubric không thể sửa trực tiếp.</p>
                  {draftCriteria.map((c, i) => (
                    <div key={i} className="rounded-xl border bg-[#f9fbfe] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold">Criterion {i + 1}</p>
                        <button className="text-xs font-semibold text-red-700" onClick={() => setDraftCriteria((v) => v.filter((_, ix) => ix !== i))}>Xóa</button>
                      </div>
                      <label className="block text-sm">Tên tiêu chí
                        <input className={field + ' mt-1'} value={c.title} onChange={(e) => editCriterion(i, { title: e.target.value })}/>
                      </label>
                      <label className="mt-3 block text-sm">Mô tả
                        <textarea className={field + ' mt-1'} rows={2} value={c.description} onChange={(e) => editCriterion(i, { description: e.target.value })}/>
                      </label>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="text-sm">Weight (%)
                          <input type="number" min={1} max={100} className={field + ' mt-1'} value={c.weight} onChange={(e) => editCriterion(i, { weight: Number(e.target.value) })}/>
                        </label>
                        <label className="text-sm">Max score
                          <input type="number" min={1} max={10} className={field + ' mt-1'} value={c.maxScore} onChange={(e) => editCriterion(i, { maxScore: Number(e.target.value) })}/>
                        </label>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className={minor} disabled={draftCriteria.length >= 30} onClick={() => setDraftCriteria((v) => [...v, { title: '', description: '', weight: 1, maxScore: 4 }])}>+ Tiêu chí</button>
                    <span className="text-sm font-bold">Tổng: {draftCriteria.reduce((n, c) => n + c.weight, 0)}%</span>
                  </div>
                  <div className="flex gap-3">
                    <button className={minor} disabled={busy} onClick={() => void storeDraft()}>Lưu draft</button>
                    <button className={primary} disabled={busy || draftCriteria.reduce((n, c) => n + c.weight, 0) !== 100}
                      onClick={() => void publishRubric()}>Publish rubric</button>
                  </div>
                </section>
              )}
              {submission && details ? (
                <section className={panel}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-bold">Review: {submission.project.title}</h3>
                    <span className="rounded-full bg-[#edf3fc] px-3 py-1 text-xs font-bold">Snapshot v{submission.version}</span>
                  </div>
                  <div className="mb-5 space-y-2">
                    <h4 className="text-sm font-bold">Evidence được nộp</h4>
                    {details.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8fc] p-3">
                        <div><p className="text-sm font-bold">{item.evidenceVersion.title} · v{item.evidenceVersion.version}</p>
                          <p className="text-xs text-slate-600">{item.evidenceVersion.reflection || item.evidenceVersion.description || 'Không có ghi chú'}</p>
                        </div>
                        {item.evidenceVersion.fileAsset && <button className={minor} onClick={() => void openFile(item.evidenceVersion.fileAsset!.id)}>Xem file</button>}
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => void submitReview(e)} className="space-y-4 border-t pt-5">
                    <label className="block text-sm font-bold">Rubric đã xuất bản
                      <select required className={field + ' mt-2'} value={rubricVersionId}
                        onChange={(e) => { setRubricVersionId(e.target.value); setRatings({}); }}>
                        <option value="">Chọn rubric</option>
                        {eligible.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                      </select>
                    </label>
                    {activeVersion?.criteria.map((c) => (
                      <div key={c.id} className="rounded-xl bg-[#f6f8fc] p-4">
                        <div className="mb-2 flex flex-wrap justify-between gap-3">
                          <div><p className="font-bold">{c.title}</p>
                            <p className="text-xs text-slate-600">{c.description || ''}</p></div>
                          <span className="text-xs font-bold">{c.weight}%</span>
                        </div>
                        <label className="text-sm">Điểm (0–{c.maxScore})
                          <input type="number" required step="0.5" min={0} max={c.maxScore} className={field + ' mt-2'}
                            value={ratings[c.id]?.score ?? ''} onChange={(e) => setRatings((old) => ({
                              ...old, [c.id]: { criterionId: c.id, score: Number(e.target.value), comment: old[c.id]?.comment },
                            }))}/>
                        </label>
                        <textarea rows={2} placeholder="Nhận xét theo tiêu chí (tùy chọn)" className={field + ' mt-2'}
                          value={ratings[c.id]?.comment ?? ''} onChange={(e) => setRatings((old) => ({
                            ...old, [c.id]: { criterionId: c.id, score: old[c.id]?.score ?? 0, comment: e.target.value },
                          }))}/>
                      </div>
                    ))}
                    <label className="block text-sm font-bold">Quyết định
                      <select className={field + ' mt-2'} value={decision} onChange={(e) => setDecision(e.target.value as 'APPROVED' | 'REVISION_REQUESTED')}>
                        <option value="REVISION_REQUESTED">Request Revision</option>
                        <option value="APPROVED">Approve</option>
                      </select>
                    </label>
                    <label className="block text-sm font-bold">Phản hồi tổng quát
                      <textarea rows={4} required={decision === 'REVISION_REQUESTED'} maxLength={3000} className={field + ' mt-2'}
                        value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Điều làm tốt và các bước cần cải thiện"/>
                    </label>
                    <button className={primary} disabled={busy || !activeVersion ||
                      activeVersion.criteria.some((c) => ratings[c.id]?.score === undefined)}>
                      <Send size={15} className="mr-2 inline"/> Công bố đánh giá
                    </button>
                  </form>
                </section>
              ) : (
                <section className={panel + ' py-16 text-center'}>
                  <ShieldCheck className="mx-auto mb-4 text-[#153b77]" size={32}/>
                  <h3 className="text-xl font-bold">Chọn submission cần đánh giá</h3>
                  <p className="mt-2 text-sm text-slate-600">Rubric công bố sẽ được gắn với đúng phiên bản bài nộp, không ảnh hưởng lịch sử.</p>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
