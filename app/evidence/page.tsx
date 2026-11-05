'use client';

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft, CheckCircle2, FileUp, FolderLock, History,
  LoaderCircle, RefreshCcw, Send, Shield, Upload, Wand2,
} from 'lucide-react';

import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type User = { id: string; fullName: string; role: 'STUDENT' | 'LECTURER' | 'ADMIN' | 'MENTOR' };
type Mode = 'EMPATHIZE' | 'DEFINE' | 'IDEATE' | 'PROTOTYPE' | 'TEST';
type FileAsset = { id: string; fileName: string; mimeType: string; size: number };
type Version = {
  id: string; version: number; title: string; description?: string | null;
  reflection?: string | null; type: string; fileAsset?: FileAsset | null;
  createdAt: string; createdBy: { id: string; fullName: string };
};
type Evidence = {
  id: string; title: string; description?: string | null; reflection?: string | null;
  type: string; activeVersion: number; sprintStage: { stage: Mode };
  versions: Version[];
};
type Project = {
  id: string; title: string; ownerId: string; challengeId?: string | null;
  challenge?: { milestones: { id: string; title: string; dueAt?: string | null; allowLate: boolean }[] } | null;
};
type Submission = {
  id: string; version: number; scopeKey: string; kind: 'PROJECT' | 'MILESTONE';
  note?: string | null; isLate: boolean; status: string; submittedAt: string;
  items: { id: string; evidenceVersion: Version }[];
};
type Iteration = { id: string; reason: string; nextDecision: string; mode?: Mode | null; createdAt: string };
type UploadToken = { intentId: string; token: string; bucket: string; storageKey: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const modes: Mode[] = ['EMPATHIZE', 'DEFINE', 'IDEATE', 'PROTOTYPE', 'TEST'];
const types = ['INTERVIEW','OBSERVATION','PERSONA','JOURNEY_MAP','AFFINITY_MAP','NEED_STATEMENT','IDEA','PROTOTYPE','TEST_RESULT','PHOTO','VIDEO','DOCUMENT','REFLECTION'];
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-offset-2 focus:outline-[#f37021]';
const primary = 'rounded-xl bg-[#153b77] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';
const secondary = 'rounded-xl border px-4 py-2.5 text-sm font-semibold text-[#153b77] disabled:opacity-50';

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer ' + token);
  if (init?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(API_URL + path, { ...init, headers });
  if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + (await response.text()).slice(0, 240));
  return response.json() as Promise<T>;
}

export default function EvidenceStudioPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const [mode, setMode] = useState<Mode>('EMPATHIZE');
  const [evidenceType, setEvidenceType] = useState('DOCUMENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reflection, setReflection] = useState('');
  const [newVersionOf, setNewVersionOf] = useState<Evidence | null>(null);
  const [chosenFile, setChosenFile] = useState<File | null>(null);
  const [fileAsset, setFileAsset] = useState<FileAsset | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string,string>>({});
  const [milestoneId, setMilestoneId] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [iterationReason, setIterationReason] = useState('');
  const [iterationDecision, setIterationDecision] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const token = session?.access_token ?? '';
  const canWrite = user?.role === 'STUDENT' || user?.role === 'ADMIN';

  useEffect(() => {
    let active = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void auth.getSession().then(({ data }) => {
        if (active) { setSession(data.session); setAuthReady(true); }
      });
      const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Missing auth configuration.');
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!token) { setUser(null); setProjects([]); setProject(null); return; }
    let active = true;
    void (async () => {
      setBusy(true);
      try {
        const account = await api<User>(token, '/auth/me');
        const list = account.role === 'STUDENT'
          ? await api<Project[]>(token, '/teams/my')
          : await api<Project[]>(token, '/projects');
        if (!active) return;
        setUser(account); setProjects(list);
        const requested = new URLSearchParams(window.location.search).get('projectId');
        const first = list.find((item) => item.id === requested) ?? list[0];
        if (first) await load(first.id);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load projects.');
      } finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [token]);

  async function load(id: string) {
    const [detail, versioned, snapshots, notes] = await Promise.all([
      api<Project>(token, '/teams/' + id),
      api<Evidence[]>(token, '/projects/' + id + '/versioned-evidence'),
      api<Submission[]>(token, '/projects/' + id + '/snapshot-submissions'),
      api<Iteration[]>(token, '/projects/' + id + '/iteration-notes'),
    ]);
    setProject(detail); setEvidence(versioned); setSubmissions(snapshots); setIterations(notes);
    setNewVersionOf(null); setFileAsset(null); setChosenFile(null);
    setTitle(''); setDescription(''); setReflection(''); setSelectedVersions({});
  }

  function clean() { setNotice(''); setError(''); }
  function fail(err: unknown) { setError(err instanceof Error ? err.message : 'Request failed.'); }
  async function run(fn: () => Promise<void>) {
    clean(); setBusy(true);
    try { await fn(); } catch (err) { fail(err); } finally { setBusy(false); }
  }

  function selectProject(id: string) { void run(async () => { await load(id); }); }
  function attachFile(event: ChangeEvent<HTMLInputElement>) {
    setChosenFile(event.target.files?.[0] ?? null); setFileAsset(null);
  }

  async function upload() {
    if (!chosenFile || !project) return;
    await run(async () => {
      if (!chosenFile.type) throw new Error('Please choose a file with a recognized MIME type.');
      const ticket = await api<UploadToken>(token, '/projects/' + project.id + '/uploads/presign', {
        method: 'POST', body: JSON.stringify({
          fileName: chosenFile.name, mimeType: chosenFile.type, size: chosenFile.size,
        }),
      });
      const { error: uploadError } = await getSupabaseBrowserClient().storage
        .from(ticket.bucket).uploadToSignedUrl(
          ticket.storageKey, ticket.token, chosenFile, { contentType: chosenFile.type },
        );
      if (uploadError) throw uploadError;
      const asset = await api<FileAsset>(token, '/uploads/' + ticket.intentId + '/complete', {
        method: 'POST',
      });
      setFileAsset(asset);
      setChosenFile(null);
      setNotice('File thật đã được lưu và xác minh trong private storage.');
    });
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!project) return;
    await run(async () => {
      if (newVersionOf) {
        await api(token, '/versioned-evidence/' + newVersionOf.id, {
          method: 'PATCH',
          body: JSON.stringify({
            type: evidenceType, title, description, reflection,
            fileAssetId: fileAsset?.id,
          }),
        });
      } else {
        await api(token, '/projects/' + project.id + '/versioned-evidence', {
          method: 'POST',
          body: JSON.stringify({
            mode, type: evidenceType, title, description, reflection,
            fileAssetId: fileAsset?.id,
          }),
        });
      }
      await load(project.id);
      setNotice(newVersionOf ? 'Đã lưu phiên bản evidence mới.' : 'Đã tạo evidence phiên bản 1.');
    });
  }

  function revise(item: Evidence) {
    const latest = item.versions[0];
    setNewVersionOf(item);
    setTitle(latest?.title ?? item.title);
    setDescription(latest?.description ?? '');
    setReflection(latest?.reflection ?? '');
    setEvidenceType(latest?.type ?? item.type);
    setMode(item.sprintStage.stage); setFileAsset(null); setChosenFile(null);
    document.getElementById('evidence-editor')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function getDownload(id: string) {
    await run(async () => {
      const data = await api<{ signedUrl: string }>(token, '/file-assets/' + id + '/download');
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    });
  }

  async function recordIteration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!project) return;
    await run(async () => {
      await api(token, '/projects/' + project.id + '/iteration-notes', {
        method: 'POST', body: JSON.stringify({ reason: iterationReason, nextDecision: iterationDecision, mode }),
      });
      setIterationReason(''); setIterationDecision('');
      setIterations(await api<Iteration[]>(token, '/projects/' + project.id + '/iteration-notes'));
      setNotice('Iteration decision đã được lưu.');
    });
  }

  async function submitSnapshot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!project) return;
    const ids = Object.values(selectedVersions).filter(Boolean);
    if (!ids.length) { setError('Chọn tối thiểu một evidence version.'); return; }
    await run(async () => {
      const submission = await api<Submission>(token, '/projects/' + project.id + '/snapshot-submissions', {
        method: 'POST',
        body: JSON.stringify({
          milestoneId: milestoneId || undefined,
          evidenceVersionIds: ids,
          note: submissionNote,
        }),
      });
      setSelectedVersions({}); setSubmissionNote('');
      setSubmissions(await api<Submission[]>(token, '/projects/' + project.id + '/snapshot-submissions'));
      setNotice('Đã nộp snapshot bất biến, phiên bản #' + submission.version + '.');
    });
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#12284a]">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#153b77] p-3 text-white"><FolderLock size={24}/></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-[#f37021]">USI Design Thinking Hub</p>
              <h1 className="text-xl font-extrabold">Evidence & Submissions</h1></div>
          </div>
          <nav className="flex gap-4 text-sm font-semibold">
            <Link href="/studio" className="text-[#153b77] hover:underline"><ArrowLeft size={15} className="mr-1 inline"/> Design Studio</Link>
            <Link href="/learn" className="text-slate-500 hover:underline">Learning</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#f37021]">Release C · F09 F11 F12</p>
            <h2 className="text-3xl font-extrabold">Evidence-Centered Design</h2>
            <p className="mt-1 text-sm text-slate-500">{user ? user.fullName + ' · ' + user.role : 'Đăng nhập để xem dự án'}</p>
          </div>
          {busy && <span className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin"/> Đang xử lý…</span>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
        {!authReady && <p>Đang kiểm tra phiên…</p>}
        {authReady && !session && <div className={panel}>Cần đăng nhập trước: <Link className="font-bold underline" href="/learn">Learning Foundation</Link>.</div>}
        {session && user && (
          <>
            <section className={panel}>
              <label className="mb-2 block text-sm font-bold" htmlFor="project">Project workspace</label>
              <select id="project" className={input} value={project?.id ?? ''} onChange={(event) => selectProject(event.target.value)}>
                {!projects.length && <option value="">Chưa có project</option>}
                {projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              {!projects.length && <p className="mt-3 text-sm text-slate-500">Tạo hoặc tham gia nhóm trong <Link className="underline" href="/studio">Design Studio</Link> trước.</p>}
            </section>
            {project && (
              <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-5">
                  {canWrite && <section id="evidence-editor" className={panel + ' space-y-4'}>
                    <div className="flex items-center gap-2"><FileUp className="text-[#153b77]" size={22}/>
                      <h3 className="text-xl font-bold">{newVersionOf ? 'Tạo evidence version mới' : 'Tạo evidence'}</h3></div>
                    {newVersionOf && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#eef3fc] p-3 text-sm">
                      <span>Chỉnh sửa: <strong>{newVersionOf.title}</strong> (v{newVersionOf.activeVersion})</span>
                      <button type="button" className={secondary} onClick={() => {
                        setNewVersionOf(null); setTitle(''); setDescription(''); setReflection('');
                        setFileAsset(null); setChosenFile(null);
                      }}>Hủy</button>
                    </div>}
                    <form onSubmit={(event) => void submitEvidence(event)} className="space-y-3">
                      <label className="block text-sm font-semibold">Design Thinking mode
                        <select className={input + ' mt-2'} disabled={!!newVersionOf} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                          {modes.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold">Loại minh chứng
                        <select className={input + ' mt-2'} value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)}>
                          {types.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold">Tiêu đề
                        <input required maxLength={160} className={input + ' mt-2'} value={title} onChange={(e) => setTitle(e.target.value)}/>
                      </label>
                      <label className="block text-sm font-semibold">Mô tả
                        <textarea rows={3} maxLength={3000} className={input + ' mt-2'} value={description} onChange={(e) => setDescription(e.target.value)}/>
                      </label>
                      <label className="block text-sm font-semibold">Reflection
                        <textarea rows={3} maxLength={3000} className={input + ' mt-2'} value={reflection} onChange={(e) => setReflection(e.target.value)}/>
                      </label>
                      <div className="rounded-xl border border-dashed p-4">
                        <label className="mb-2 block text-sm font-bold">File đính kèm riêng tư (tùy chọn)</label>
                        <input type="file" onChange={attachFile} className="w-full text-sm" accept=".pdf,.png,.jpg,.jpeg,.mp3,.mp4,.txt"/>
                        {chosenFile && <p className="mt-2 text-xs text-slate-500">{chosenFile.name} · {Math.round(chosenFile.size/1024)} KB</p>}
                        {chosenFile && <button type="button" className={secondary + ' mt-3'} disabled={busy} onClick={() => void upload()}><Upload size={15} className="mr-1 inline"/> Upload & verify</button>}
                        {fileAsset && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 size={15}/>{fileAsset.fileName} — đã xác minh</p>}
                        {newVersionOf && !fileAsset && <p className="mt-2 text-xs text-slate-500">Nếu không tải file mới, phiên bản tiếp theo giữ tham chiếu file trước đó.</p>}
                      </div>
                      <button className={primary} disabled={busy}><CheckCircle2 size={15} className="mr-1 inline"/> {newVersionOf ? 'Lưu phiên bản mới' : 'Lưu evidence v1'}</button>
                    </form>
                  </section>}

                  <section className={panel}>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold"><History size={20}/> Evidence version history</h3>
                    <div className="space-y-4">
                      {evidence.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold">{item.title}</h4>
                          <span className="text-xs font-semibold text-[#153b77]">{item.sprintStage.stage} · v{item.activeVersion}</span>
                        </div>
                        <div className="space-y-2 pt-3">
                          {item.versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#f6f8fc] p-3">
                            <div className="min-w-0"><p className="text-sm font-semibold">Version {version.version}</p>
                              <p className="text-xs text-slate-500">{version.createdBy.fullName} · {new Date(version.createdAt).toLocaleString('vi-VN')}</p>
                              {version.fileAsset && <p className="text-xs text-slate-500">{version.fileAsset.fileName}</p>}
                            </div>
                            {version.fileAsset && <button className={secondary} onClick={() => void getDownload(version.fileAsset!.id)}>Download</button>}
                          </div>)}
                        </div>
                        {canWrite && <button className={secondary + ' mt-3'} onClick={() => revise(item)}><Wand2 size={15} className="mr-1 inline"/> Tạo phiên bản cải tiến</button>}
                      </div>)}
                      {!evidence.length && <p className="text-sm text-slate-500">Chưa có evidence.</p>}
                    </div>
                  </section>

                  <section className={panel}>
                    <h3 className="mb-3 text-lg font-bold">Iteration notes</h3>
                    <div className="space-y-2">
                      {iterations.map((item) => <div key={item.id} className="rounded-lg bg-[#f6f8fc] p-3 text-sm">
                        <p className="font-semibold">{item.mode || 'Project'} · {item.reason}</p>
                        <p className="mt-1 text-slate-600">Quyết định tiếp theo: {item.nextDecision}</p>
                      </div>)}
                      {!iterations.length && <p className="text-sm text-slate-500">Chưa có iteration notes.</p>}
                    </div>
                    {canWrite && <form onSubmit={(event) => void recordIteration(event)} className="mt-4 space-y-3">
                      <textarea required maxLength={2500} rows={2} className={input} placeholder="Vì sao cần thay đổi?" value={iterationReason} onChange={(e) => setIterationReason(e.target.value)}/>
                      <textarea required maxLength={2500} rows={2} className={input} placeholder="Nhóm quyết định thử nghiệm gì tiếp theo?" value={iterationDecision} onChange={(e) => setIterationDecision(e.target.value)}/>
                      <button disabled={busy} className={secondary}>+ Ghi iteration</button>
                    </form>}
                  </section>
                </div>

                <div className="space-y-5">
                  {canWrite && <section className={panel + ' space-y-4'}>
                    <div className="flex items-center gap-2"><Send size={20} className="text-[#153b77]"/><h3 className="text-xl font-bold">Nộp bài theo phiên bản</h3></div>
                    <p className="text-xs text-slate-500">Mỗi lần nộp tạo snapshot riêng; phiên bản evidence sau đó không thay đổi nội dung đã nộp.</p>
                    <form onSubmit={(event) => void submitSnapshot(event)} className="space-y-3">
                      <label className="block text-sm font-semibold">Submission scope
                        <select className={input + ' mt-2'} value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
                          <option value="">Toàn bộ project</option>
                          {project.challenge?.milestones?.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                        </select>
                      </label>
                      <p className="text-sm font-bold">Chọn phiên bản evidence để nộp</p>
                      {evidence.map((item) => <label key={item.id} className="block rounded-xl border p-3 text-sm">
                        <span className="mb-2 block font-semibold">{item.title}</span>
                        <select className={input} value={selectedVersions[item.id] ?? ''} onChange={(e) => setSelectedVersions((prev) => ({ ...prev, [item.id]: e.target.value }))}>
                          <option value="">Không chọn</option>
                          {item.versions.map((version) => <option key={version.id} value={version.id}>Version {version.version} · {version.title}</option>)}
                        </select>
                      </label>)}
                      {!evidence.length && <p className="text-sm text-slate-500">Bạn cần tạo evidence trước.</p>}
                      <textarea rows={3} className={input} maxLength={3000} placeholder="Submission note (tùy chọn)" value={submissionNote} onChange={(e) => setSubmissionNote(e.target.value)}/>
                      <button className={primary} disabled={busy || !evidence.length}><Shield size={15} className="mr-1 inline"/> Tạo snapshot & nộp</button>
                    </form>
                  </section>}

                  <section className={panel}>
                    <h3 className="mb-4 text-xl font-bold">Submission history</h3>
                    <div className="space-y-3">
                      {submissions.map((item) => <div key={item.id} className="rounded-xl border border-[#e2e8f0] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold">{item.scopeKey} · v{item.version}</h4>
                          <span className="rounded-full bg-[#eaf0fa] px-3 py-1 text-xs font-bold text-[#153b77]">{item.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{new Date(item.submittedAt).toLocaleString('vi-VN')} {item.isLate ? '· Nộp muộn' : ''}</p>
                        {item.note && <p className="mt-2 text-sm">{item.note}</p>}
                        <div className="mt-3 space-y-2">
                          {item.items.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f6f8fc] p-3 text-xs">
                            <span>{entry.evidenceVersion.title} · evidence v{entry.evidenceVersion.version}</span>
                            {entry.evidenceVersion.fileAsset && <button className={secondary} onClick={() => void getDownload(entry.evidenceVersion.fileAsset!.id)}>Download</button>}
                          </div>)}
                        </div>
                      </div>)}
                      {!submissions.length && <p className="text-sm text-slate-500">Chưa có submission.</p>}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
