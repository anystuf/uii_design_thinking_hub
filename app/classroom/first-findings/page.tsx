'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, RefreshCw, ShieldCheck } from 'lucide-react';

import { WorkspaceNav } from '@/components/workspace-nav';
import { WorkspaceLoading } from '@/components/workspace-loading';
import { authenticatedApi, workspaceProfile } from '@/lib/authenticated-api';
import { withAuthDeadline } from '@/lib/auth-timeout';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  EMPTY_FIRST_FINDINGS_PROBLEM, FIRST_FINDINGS_FIELDS,
  FIRST_FINDINGS_TITLE, buildFirstFindingsEvidence,
  firstFindingsComplete, isFirstFindingsEvidence, type FirstFindingsProblem,
} from '@/lib/first-findings';

type User = { id: string; role: string };
type Team = { id: string; title: string };
type Evidence = { id: string; title: string; versions: { id: string; version: number }[] };
const input = 'mt-2 block min-h-11 w-full rounded-xl border border-[#bfcfc8] bg-white px-3 py-2.5 text-sm text-[#173445] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600';
const panel = 'rounded-[22px] border border-[#d2dcd6] bg-white p-5 shadow-sm sm:p-7';

function ProblemEditor({ value, number, change }: {
  value: FirstFindingsProblem; number: 1 | 2;
  change: (next: FirstFindingsProblem) => void;
}) {
  return <fieldset className={panel}>
    <legend className="mb-1 text-lg font-extrabold">Vấn đề {number}</legend>
    <p className="mb-5 text-sm text-[#49616a]">Đi từ trải nghiệm thực tế của người dùng, chưa chọn giải pháp.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {FIRST_FINDINGS_FIELDS.map(field =>
        <label key={field.key} className="block text-sm font-bold">
          {field.label} <span aria-hidden="true" className="text-red-700">*</span>
          <textarea rows={3} required maxLength={350} className={input + ' resize-y font-normal'}
            value={value[field.key]} onChange={event => change({ ...value, [field.key]: event.target.value })}/>
          <span className="mt-1 block text-xs font-normal leading-5 text-[#526b6b]">{field.hint}</span>
        </label>,
      )}
    </div>
  </fieldset>;
}

/**
 * A genuine private, versioned-evidence entry, using the existing guarded API.
 * Publishing a snapshot and uploading the one-slide deliverable remain explicit
 * steps in /evidence, so a saved answer is never reported as a submitted grade.
 */
export default function FirstFindingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [role, setRole] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Evidence | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [first, setFirst] = useState<FirstFindingsProblem>({ ...EMPTY_FIRST_FINDINGS_PROBLEM });
  const [second, setSecond] = useState<FirstFindingsProblem>({ ...EMPTY_FIRST_FINDINGS_PROBLEM });
  const [teamScope, setTeamScope] = useState('');
  const token = session?.access_token ?? '';

  useEffect(() => {
    let active = true;
    try {
      const auth = getSupabaseBrowserClient().auth;
      void withAuthDeadline(() => auth.getSession())
        .then(({ data, error: authError }) => {
          if (!active) return;
          if (authError) setError('Không xác minh được phiên đăng nhập.');
          setSession(data.session); setAuthReady(true);
        }).catch(() => { if (active) { setAuthReady(true); setError('Không kết nối được dịch vụ xác thực.'); } });
      const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch {
      setAuthReady(true); setError('Dịch vụ xác thực UII chưa được cấu hình.');
    }
  }, []);

  useEffect(() => {
    if (!token) { setRole(''); setTeams([]); setTeamId(''); return; }
    let active = true; setLoading(true); setError('');
    void (async () => {
      try {
        const profile = await workspaceProfile<User>(token);
        if (!active) return;
        setRole(profile.role);
        if (profile.role !== 'STUDENT') return;
        const mine = await authenticatedApi<Team[]>('/teams/my', token);
        if (!active) return;
        setTeams(mine);
        const wanted = new URLSearchParams(window.location.search).get('projectId');
        setTeamId(mine.find(item => item.id === wanted)?.id ?? mine[0]?.id ?? '');
      } catch {
        if (active) setError('Chưa tải được nhóm của bạn. Kiểm tra phiên đăng nhập và thử lại.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !teamId || role !== 'STUDENT') { setExisting(null); return; }
    let active = true; setChecking(true); setExisting(null); setSaved(false); setError('');
    void authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token)
      .then(items => { if (active) setExisting(items.find(isFirstFindingsEvidence) ?? null); })
      .catch(() => { if (active) setError('Không thể kiểm tra bài đã lưu. Không tạo bản nộp trùng khi chưa xác minh.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [token, role, teamId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || role !== 'STUDENT' || !teamId || checking || saving || existing || error) return;
    if (!firstFindingsComplete(first, second, teamScope)) {
      setError('Hãy trả lời đầy đủ cho cả hai vấn đề và nguồn lực giới hạn của nhóm.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = buildFirstFindingsEvidence(first, second, teamScope);
      const current = await authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token);
      if (current.some(isFirstFindingsEvidence)) {
        setExisting(current.find(isFirstFindingsEvidence) ?? null);
        setError('Nhóm đã có Activity 2. Mở Minh chứng để tạo phiên bản cải tiến, không tạo bản trùng.');
        return;
      }
      await authenticatedApi('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token, {
        method: 'POST', body: JSON.stringify(payload),
      });
      // A successful HTTP response is not enough: read the persisted version back.
      const after = await authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token);
      const result = after.find(isFirstFindingsEvidence);
      if (!result) throw new Error('Chưa xác minh được bản lưu. Không gửi lại trước khi tải lại trang.');
      setExisting(result); setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xác nhận được bản lưu; hãy kiểm tra Minh chứng trước khi thử lại.');
    } finally {
      setSaving(false);
    }
  }

  const eligible = !!token && role === 'STUDENT' && !!teamId;
  const evidenceHref = teamId ? '/evidence?projectId=' + encodeURIComponent(teamId) : '/evidence';
  const ready = firstFindingsComplete(first, second, teamScope);

  return <div className="uii-workspace min-h-screen bg-[#faf8f1] text-[#173445]">
    <WorkspaceNav title="Activity 2 · First Findings" role={role === 'STUDENT' ? 'STUDENT' : role === 'LECTURER' ? 'LECTURER' : role === 'ADMIN' ? 'ADMIN' : undefined}
      guest={authReady && !session}/>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Link href="/classroom" className="inline-flex min-h-11 items-center text-sm font-bold underline">Quay về Buổi học</Link>
        <p className="text-xs font-black tracking-widest text-[#a94716]">CHƯƠNG 10 · DESIGN THINKING · SLIDES 64–65</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Activity 2 · First Findings</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#46616b]">Tìm hiểu <strong>hai vấn đề có thật</strong> của cộng đồng. Chứng minh từ góc nhìn người dùng, trước khi nghĩ đến giải pháp.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={panel}><BookOpen className="mb-2" size={22} aria-hidden="true"/><strong>01 · Khám phá</strong><p className="mt-2 text-sm">Trả lời sáu câu hỏi cho từng vấn đề.</p></div>
        <div className={panel}><ClipboardList className="mb-2" size={22} aria-hidden="true"/><strong>02 · Minh chứng</strong><p className="mt-2 text-sm">Tạo một slide tổng hợp, chuẩn bị trình bày 2 phút.</p></div>
        <div className={panel}><ShieldCheck className="mb-2" size={22} aria-hidden="true"/><strong>03 · Nộp & cải tiến</strong><p className="mt-2 text-sm">Lưu bản nháp, nộp snapshot, xem phản hồi của cô.</p></div>
      </div>

      {!authReady && <WorkspaceLoading label="Đang xác minh tài khoản..."/>}
      {authReady && !session && <div className={panel}>
        <h2 className="text-xl font-black">Đăng nhập bằng tài khoản sinh viên UII</h2>
        <p className="mt-2 mb-4 text-sm">Hoạt động và minh chứng chỉ được lưu trong dự án mà bạn có quyền tham gia.</p>
        <Link className="font-bold underline" href="/learn">Đăng nhập để tiếp tục</Link>
      </div>}
      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        {error} <button type="button" className="ml-2 font-bold underline" onClick={() => window.location.reload()}>Tải lại để kiểm tra</button>
      </div>}
      {loading && <WorkspaceLoading label="Đang tải nhóm dự án..."/>}
      {session && !loading && role !== 'STUDENT' && <section className={panel}>
        <p className="font-bold">Biểu mẫu này dành cho sinh viên.</p>
        <p className="mt-2 text-sm">Giảng viên có thể giao hoạt động trong Studio và theo dõi nhóm tại trang Buổi học.</p>
        <Link href="/classroom" className="mt-3 inline-flex font-semibold underline">Về bảng giảng viên</Link>
      </section>}
      {session && role === 'STUDENT' && !loading && !teams.length && <section className={panel}>
        <h2 className="text-lg font-bold">Bạn chưa có nhóm dự án</h2>
        <p className="mt-2 text-sm">Vào Studio, tham gia nhóm trong khóa học trước khi lưu bài.</p>
        <Link className="mt-4 inline-flex font-bold underline" href="/studio">Mở Studio</Link>
      </section>}
      {eligible && !loading && <section className={panel}>
        <label htmlFor="activity2-team" className="block text-sm font-bold">Nhóm thực hiện</label>
        <select id="activity2-team" value={teamId}
          onChange={e => setTeamId(e.target.value)} className={input}>
          {teams.map(team => <option value={team.id} key={team.id}>{team.title}</option>)}
        </select>
        <p className="mt-3 text-xs leading-6 text-[#526b6b]">Không nhập tên, số điện thoại hoặc dữ liệu nhận diện của người phỏng vấn. Chỉ sử dụng bằng chứng đã được phép chia sẻ riêng tư cho giảng viên.</p>
      </section>}

      {eligible && (checking || saving) && <p role="status" className="rounded-xl bg-[#e8f4ec] p-3 text-sm">
        {saving ? 'Đang lưu và xác minh phiên bản trên máy chủ…' : 'Đang kiểm tra minh chứng đã lưu…'}
      </p>}
      {eligible && existing && !checking && <section className={panel}>
        <div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 size={23} aria-hidden="true"/><h2 className="text-xl font-black">Đã lưu Activity 2 trong dự án</h2></div>
        <p className="mt-2 text-sm leading-6">
          {saved ? 'Bản ghi đã được xác nhận từ máy chủ.' : 'Nhóm đã có một bản ghi Activity 2.'}
          {' '}Đây mới là minh chứng, <strong>chưa có nghĩa bài đã được nộp hoặc chấm</strong>.
        </p>
        <p className="mt-2 text-sm text-[#526b6b]">Tiếp theo: đính kèm 1 slide (file riêng tư hoặc link được giảng viên truy cập), chọn phiên bản minh chứng, tạo submission snapshot và chuẩn bị phần trình bày 2 phút.</p>
        <Link href={evidenceHref} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white">
          Đến bước Minh chứng và nộp bài <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </section>}

      {eligible && !checking && !existing && !error && <form onSubmit={event => void save(event)} className="space-y-5">
        <ProblemEditor number={1} value={first} change={setFirst}/>
        <ProblemEditor number={2} value={second} change={setSecond}/>
        <section className={panel}>
          <label className="block text-sm font-bold">
            Nhóm có những nguồn lực và giới hạn gì? (thời gian, nhân sự, thiết bị, chi phí)
            <textarea required rows={4} maxLength={500} className={input + ' resize-y font-normal'} value={teamScope}
              onChange={event => setTeamScope(event.target.value)} />
          </label>
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Đầu ra trong bài giảng:</strong> 1 slide tổng hợp và bài trình bày 2 phút. Mẫu này chỉ lưu phân tích hai vấn đề; việc upload slide và nộp bài được thực hiện ở bước tiếp theo.
          </div>
          <button type="submit" disabled={!ready || saving || checking}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            Lưu minh chứng Activity 2 <ArrowRight size={16} aria-hidden="true"/>
          </button>
          <p className="mt-2 text-xs text-[#526b6b]">Không gửi hai lần khi mạng chậm. Sau khi lưu, hệ thống tải lại bản ghi để xác nhận phiên bản.</p>
        </section>
      </form>}
      {eligible && <p className="text-xs leading-6 text-[#526b6b]">
        Không có bài mẫu nào được tự động coi là kết quả thật. Việc cô đánh giá và yêu cầu chỉnh sửa vẫn thực hiện ở /review với rubric đã xuất bản.
        Tiêu đề minh chứng: {FIRST_FINDINGS_TITLE}.
      </p>}
    </main>
  </div>;
}
