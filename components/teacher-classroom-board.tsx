'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';
import { authenticatedApi } from '@/lib/authenticated-api';
import { FIRST_FINDINGS_TITLE } from '@/lib/first-findings';
import { groupPilotStatus, PILOT_GROUP_LABELS, type PilotGroupStatus } from '@/lib/classroom-group-status';

type Challenge = { id: string; title: string; status: string };
type Team = { id: string; title: string };
type Evidence = { title: string; versions?: { id: string }[] };
type Submission = { status: string; version: number; submittedAt: string };
type BoardRow = {
  id: string; title: string; challengeTitle: string;
  evidenceCount?: number; firstFindings?: boolean;
  submissions?: number; status: PilotGroupStatus;
};

const MAX_PILOT_GROUPS = 32;

/** Teacher-only presentation: all data requests are authorized by the API. */
export function TeacherClassroomBoard({ token, challenges, courseId }: {
  token: string; challenges: Challenge[]; courseId: string;
}) {
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let active = true;
    setRows([]); setError(''); setTruncated(false);
    const published = challenges.filter(c => c.status === 'PUBLISHED');
    if (!token || !courseId || !published.length) return;

    setLoading(true);
    void (async () => {
      try {
        const collections = await Promise.all(
          published.map(async challenge => ({
            challenge,
            teams: await authenticatedApi<Team[]>('/challenges/' + encodeURIComponent(challenge.id) + '/teams', token),
          })),
        );
        if (!active) return;
        const allTeams = collections.flatMap(({ challenge, teams }) =>
          teams.map(team => ({ team, challenge })),
        );
        setTruncated(allTeams.length > MAX_PILOT_GROUPS);
        // Bounded parallel requests: no hidden PII, no writes or auto-publishing.
        const selected = allTeams.slice(0, MAX_PILOT_GROUPS);
        const results: BoardRow[] = await Promise.all(selected.map(async ({ team, challenge }) => {
          const path = '/projects/' + encodeURIComponent(team.id);
          try {
            const [evidence, submissions] = await Promise.all([
              authenticatedApi<Evidence[]>(path + '/versioned-evidence', token),
              authenticatedApi<Submission[]>(path + '/snapshot-submissions', token),
            ]);
            const count = evidence.filter(e => !!e.versions?.length).length;
            return {
              id: team.id, title: team.title, challengeTitle: challenge.title,
              evidenceCount: count,
              firstFindings: evidence.some(e => e.title === FIRST_FINDINGS_TITLE && !!e.versions?.length),
              submissions: submissions.length,
              status: groupPilotStatus(count, submissions),
            };
          } catch {
            return { id: team.id, title: team.title, challengeTitle: challenge.title,
              status: 'UNKNOWN' as const };
          }
        }));
        if (active) setRows(results);
      } catch {
        if (active) setError('Could not load the team list. Progress cannot be inferred until the API responds.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token, courseId, challenges, refresh]);

  const hasUnknown = rows.some(row => row.status === 'UNKNOWN');

  return <section aria-label="Team progress" className="rounded-[22px] border border-[#d2dcd6] bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#a94716]">LECTURER · TEAM PROGRESS</p>
        <h2 className="mt-2 text-xl font-black">Project team progress</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#49616a]">
          Displays only submissions and evidence confirmed by the API. It does not infer grades or student understanding.
        </p>
      </div>
      <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">
        <RefreshCcw size={16} aria-hidden="true"/> Refresh
      </button>
    </div>
    {loading && <p role="status" className="mt-4 text-sm">Checking progress against the database…</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    {hasUnknown && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      Some teams could not be loaded. Check API access before concluding that they have not submitted.
    </p>}
    {truncated && <p role="status" className="mt-3 text-sm text-amber-900">
      Showing up to {MAX_PILOT_GROUPS} teams. Filter by course or challenge for additional teams.
    </p>}
    {!loading && !error && !rows.length && <p className="mt-4 rounded-xl bg-[#f5f7f3] p-3 text-sm">
      No teams were found for published challenges in this course. Open Studio to prepare the session.
    </p>}
    {!!rows.length && <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead><tr className="border-b text-[#51636b]">
          <th className="py-3 pr-3">Team / challenge</th>
          <th className="px-3 py-3">Activity 2</th>
          <th className="px-3 py-3">Status</th>
          <th className="py-3 pl-3 text-right">Action</th>
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-b border-[#e8eee8]">
          <td className="py-3 pr-3"><span className="block font-bold">{row.title}</span>
            <span className="block text-xs text-[#667b7e]">{row.challengeTitle}</span></td>
          <td className="px-3 py-3">
            {row.firstFindings === undefined ? 'Not verified' : row.firstFindings ? 'Saved' : 'Not saved'}
          </td>
          <td className="px-3 py-3">
            <span className={'inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ' +
              (row.status === 'UNKNOWN' ? 'bg-amber-100 text-amber-950' :
                row.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900' :
                row.status === 'REVISION_REQUESTED' ? 'bg-orange-100 text-orange-950' : 'bg-slate-100 text-slate-700')}>
              {PILOT_GROUP_LABELS[row.status]}
            </span>
            {row.evidenceCount !== undefined && <span className="ml-2 text-xs text-[#657579]">{row.evidenceCount} evidence items</span>}
          </td>
          <td className="py-3 pl-3 text-right">
            <Link href={'/evidence?projectId=' + encodeURIComponent(row.id)}
              className="inline-flex min-h-11 items-center gap-1 font-bold text-[#173445] underline">
              View evidence <ArrowRight size={14} aria-hidden="true"/>
            </Link>
          </td>
        </tr>)}</tbody>
      </table>
    </div>}
    {!!rows.length && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-[#f1f7f2] p-3 text-sm">
      <ShieldCheck size={18} aria-hidden="true"/>
      <span>Only authorized lecturers may access course data. Gallery Walk has not published any private evidence.</span>
      <Link href="/review" className="font-bold underline">Open review queue</Link>
    </div>}
  </section>;
}
