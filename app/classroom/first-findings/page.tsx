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
    <legend className="mb-1 text-lg font-extrabold">Problem {number}</legend>
    <p className="mb-5 text-sm text-[#49616a]">Start with people's lived experience—not a preselected solution.</p>
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
          if (authError) setError('Could not verify your sign-in session.');
          setSession(data.session); setAuthReady(true);
        }).catch(() => { if (active) { setAuthReady(true); setError('Could not reach the authentication service.'); } });
      const { data: { subscription } } = auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next);
      });
      return () => { active = false; subscription.unsubscribe(); };
    } catch {
      setAuthReady(true); setError('UII authentication is not configured.');
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
        if (active) setError('Could not load your teams. Check your session and try again.');
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token || !teamId || role !== 'STUDENT') { setExisting(null); return; }
    let active = true; setChecking(true); setExisting(null); setSaved(false); setError('');
    void authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token)
      .then(items => { if (active) setExisting(items.find(isFirstFindingsEvidence) ?? null); })
      .catch(() => { if (active) setError('Could not verify existing evidence. Do not create a duplicate submission until it is checked.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [token, role, teamId]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || role !== 'STUDENT' || !teamId || checking || saving || existing || error) return;
    if (!firstFindingsComplete(first, second, teamScope)) {
      setError('Complete both problems and your team’s resource constraints.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = buildFirstFindingsEvidence(first, second, teamScope);
      const current = await authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token);
      if (current.some(isFirstFindingsEvidence)) {
        setExisting(current.find(isFirstFindingsEvidence) ?? null);
        setError('Your team already saved Activity 2. Open Evidence to create a revision instead of a duplicate.');
        return;
      }
      await authenticatedApi('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token, {
        method: 'POST', body: JSON.stringify(payload),
      });
      // A successful HTTP response is not enough: read the persisted version back.
      const after = await authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token);
      const result = after.find(isFirstFindingsEvidence);
      if (!result) throw new Error('The save could not be verified. Reload before trying again.');
      setExisting(result); setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm the save. Check Evidence before retrying.');
    } finally {
      setSaving(false);
    }
  }

  async function verifySaved() {
    if (!token || !teamId) { window.location.reload(); return; }
    setChecking(true); setError('');
    try {
      const evidence = await authenticatedApi<Evidence[]>('/projects/' + encodeURIComponent(teamId) + '/versioned-evidence', token);
      setExisting(evidence.find(isFirstFindingsEvidence) ?? null);
    } catch {
      setError('Could not verify project data. Do not resubmit until the server responds.');
    } finally { setChecking(false); }
  }

  const eligible = !!token && role === 'STUDENT' && !!teamId;
  const evidenceHref = teamId ? '/evidence?projectId=' + encodeURIComponent(teamId) : '/evidence';
  const ready = firstFindingsComplete(first, second, teamScope);

  return <div className="uii-workspace min-h-screen bg-[#faf8f1] text-[#173445]">
    <WorkspaceNav title="Activity 2 · First Findings" role={role === 'STUDENT' ? 'STUDENT' : role === 'LECTURER' ? 'LECTURER' : role === 'ADMIN' ? 'ADMIN' : undefined}
      guest={authReady && !session}/>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <Link href="/classroom" className="inline-flex min-h-11 items-center text-sm font-bold underline">Back to Classroom</Link>
        <p className="text-xs font-black tracking-widest text-[#a94716]">CHAPTER 10 · DESIGN THINKING · SLIDES 64–65</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Activity 2 · First Findings</h1>
        <p className="max-w-3xl text-sm leading-7 text-[#46616b]">Explore <strong>two real-world problems</strong> affecting your community. Support each one with evidence from users before proposing solutions.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className={panel}><BookOpen className="mb-2" size={22} aria-hidden="true"/><strong>01 · Discover</strong><p className="mt-2 text-sm">Answer six questions for each problem.</p></div>
        <div className={panel}><ClipboardList className="mb-2" size={22} aria-hidden="true"/><strong>02 · Evidence</strong><p className="mt-2 text-sm">Create a one-slide summary and prepare a two-minute presentation.</p></div>
        <div className={panel}><ShieldCheck className="mb-2" size={22} aria-hidden="true"/><strong>03 · Submit & Revise</strong><p className="mt-2 text-sm">Save your work, submit a snapshot, and review lecturer feedback.</p></div>
      </div>

      {!authReady && <WorkspaceLoading label="Verifying your account..."/>}
      {authReady && !session && <div className={panel}>
        <h2 className="text-xl font-black">Sign in with your UII student account</h2>
        <p className="mt-2 mb-4 text-sm">Activities and evidence are saved only to projects you are authorized to access.</p>
        <Link className="font-bold underline" href="/learn">Sign in to continue</Link>
      </div>}
      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        {error} <button type="button" className="ml-2 font-bold underline" onClick={() => void verifySaved()}>Recheck saved evidence</button>
      </div>}
      {loading && <WorkspaceLoading label="Loading project teams..."/>}
      {session && !loading && role !== 'STUDENT' && <section className={panel}>
        <p className="font-bold">This form is for students.</p>
        <p className="mt-2 text-sm">Lecturers can assign activities in Studio and monitor teams in Classroom.</p>
        <Link href="/classroom" className="mt-3 inline-flex font-semibold underline">Back to lecturer board</Link>
      </section>}
      {session && role === 'STUDENT' && !loading && !teams.length && <section className={panel}>
        <h2 className="text-lg font-bold">You have not joined a project team</h2>
        <p className="mt-2 text-sm">Open Studio and join your course team before saving evidence.</p>
        <Link className="mt-4 inline-flex font-bold underline" href="/studio">Open Studio</Link>
      </section>}
      {eligible && !loading && <section className={panel}>
        <label htmlFor="activity2-team" className="block text-sm font-bold">Your team</label>
        <select id="activity2-team" value={teamId}
          onChange={e => {
            if (firstFindingsComplete(first, second, teamScope) &&
                !window.confirm('Changing teams discards unsaved answers. Continue?')) return;
            setTeamId(e.target.value);
            setFirst({ ...EMPTY_FIRST_FINDINGS_PROBLEM });
            setSecond({ ...EMPTY_FIRST_FINDINGS_PROBLEM });
            setTeamScope('');
          }} className={input}>
          {teams.map(team => <option value={team.id} key={team.id}>{team.title}</option>)}
        </select>
        <p className="mt-3 text-xs leading-6 text-[#526b6b]">Do not include interviewee names, phone numbers, or identifying information. Share only evidence approved for private lecturer review.</p>
      </section>}

      {eligible && (checking || saving) && <p role="status" className="rounded-xl bg-[#e8f4ec] p-3 text-sm">
        {saving ? 'Saving and verifying the version on the server…' : 'Checking existing saved evidence…'}
      </p>}
      {eligible && existing && !checking && <section className={panel}>
        <div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 size={23} aria-hidden="true"/><h2 className="text-xl font-black">Activity 2 evidence saved</h2></div>
        <p className="mt-2 text-sm leading-6">
          {saved ? 'The server has confirmed this record.' : 'Your team already has an Activity 2 record.'}
          {' '}This is saved evidence only; <strong>it has NOT been submitted or assessed</strong>.
        </p>
        <p className="mt-2 text-sm text-[#526b6b]">Next: attach a one-slide summary (private file or lecturer-accessible link), select the right evidence version, submit a snapshot, and prepare your two-minute presentation.</p>
        <Link href={evidenceHref} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white">
          Continue to Evidence & Submission <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </section>}

      {eligible && !checking && !existing && !error && <form onSubmit={event => void save(event)} className="space-y-5">
        <ProblemEditor number={1} value={first} change={setFirst}/>
        <ProblemEditor number={2} value={second} change={setSecond}/>
        <section className={panel}>
          <label className="block text-sm font-bold">
            What resources and constraints does your team have? (time, people, equipment, budget)
            <textarea required rows={4} maxLength={500} className={input + ' resize-y font-normal'} value={teamScope}
              onChange={event => setTeamScope(event.target.value)} />
          </label>
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong>Required deliverables:</strong> One summary slide and a two-minute presentation. This form saves your analysis of two problems only; attaching the slide and submitting happens next.
          </div>
          <button type="submit" disabled={!ready || saving || checking}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
            Save Activity 2 Evidence <ArrowRight size={16} aria-hidden="true"/>
          </button>
          <p className="mt-2 text-xs text-[#526b6b]">Do not submit twice on a slow connection. The system reloads evidence after saving to confirm the version.</p>
        </section>
      </form>}
      {eligible && <p className="text-xs leading-6 text-[#526b6b]">
        Demo work is never treated as verified results. Lecturer assessment and revision requests take place in /review using the published rubric.
        Evidence: Activity 2 · First Findings — Two Real-World Problems.
      </p>}
    </main>
  </div>;
}
