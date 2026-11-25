import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ClipboardCheck, FileCheck2, LockKeyhole, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Classroom Pilot Guide | UII Design Thinking Hub",
  description: "A step-by-step Chapter 10 Activity 2 pilot for students and lecturers, including usability feedback.",
};

const studentSteps = [
  { title: "Open your classroom", body: "Choose Classroom and check whether the next task is obvious. If you have not received an approved test account, use Try the demo instead. Never enter real classroom records.", href: "/classroom", label: "Open Classroom" },
  { title: "Select your assigned team and Activity 2", body: "Use only a synthetic team approved by your lecturer. Do not create teams containing real student data.", href: "/classroom/first-findings", label: "Open Activity 2" },
  { title: "Investigate TWO real-world problems", body: "For each problem: describe the issue, evidence that it is real, who is affected, how people currently respond, what resources they use, and why the project is valuable. Note your team's constraints: people, time, and equipment.", href: null, label: null },
  { title: "Save evidence and verify it", body: "Select Save Activity 2 Evidence and wait for server confirmation. Reload to check that your work persists. Saving evidence does NOT mean your assignment was submitted.", href: null, label: null },
  { title: "Attach your one-slide summary and submit", body: "Only after your lecturer authorizes authenticated testing: open Evidence, attach your one-slide summary (PDF, image, or lecturer-accessible link), choose the correct evidence versions, and submit a snapshot.", href: "/evidence", label: "Open Evidence" },
  { title: "Review feedback and improve", body: "Read the lecturer's revision request, create a new version, and resubmit. Check that your earlier submission remains unchanged.", href: "/notifications", label: "View notifications" },
] as const;

const teacherSteps = [
  { title: "Select two separate test teams", body: "Use at least two dedicated student test accounts with separate access rights. Do not bulk-import the 50-student roster." },
  { title: "Prepare the activity and team permissions", body: "Confirm the course/challenge is published, teams are correctly assigned, and Activity 2 is available in Classroom." },
  { title: "Verify actual submissions", body: "Use Submission Review to inspect a submitted snapshot. Assess only entries marked SUBMITTED, not evidence that was merely saved." },
  { title: "Request revisions and verify history", body: "Request a specific improvement, then inspect the new submission to confirm the previous snapshot is preserved." },
  { title: "Check cross-team privacy", body: "Confirm that Team B cannot view or edit Team A's private content. Stop testing immediately if cross-team access is possible." },
] as const;

const feedbackQuestions = [
  "1. Within 10 seconds, could you identify your next task? (Yes / No)",
  "2. Where did you get stuck? (Sign in / Select team / Work / Save / Submit / Feedback / Other)",
  "3. Did your saved work survive a page reload? (Yes / No / Not tested)",
  "4. What felt distracting or overwhelming?",
  "5. What is the single most important improvement you would suggest?",
  "Device/browser: ... | Redacted error screenshot (optional): ...",
];

function SectionHeading({ number, title, description }: {number: string; title: string; description: string}) {
  return <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#9b512c]">{number}</p><h2 className="mt-2 text-xl font-black tracking-tight text-[#173445] sm:text-2xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-[#52656b]">{description}</p></div>;
}

export default function ClassroomPilotPage() {
  return <main id="main-content" className="min-h-screen bg-[#faf8f1] px-4 py-8 text-[#173445] sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-3 font-black"><span className="grid size-10 place-items-center rounded-xl bg-[#173445] text-sm text-white">UII</span> Design Thinking Hub</Link>
        <span className="rounded-full border border-[#cbdad0] bg-white px-4 py-2 text-xs font-bold text-[#52656b]">PILOT · Activity 2 / First Findings</span>
      </header>
      <section aria-labelledby="pilot-title" className="mt-8 overflow-hidden rounded-[28px] bg-[#173445] p-6 text-white sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#bfe7d9]">Guided test · Lecturer & two student teams</p>
        <h1 id="pilot-title" className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">One clear task. One complete learning loop.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e0efec]">Test whether students can find their task, practise, save evidence, submit, receive feedback, and revise. This is a limited pilot—not the official submission platform for the whole class.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f9d29f] px-5 py-3 text-sm font-black text-[#173445] hover:bg-white">Try the demo without an account <ArrowRight size={17}/></Link>
          <Link href="/learn" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Sign in with a test account <ArrowRight size={17}/></Link>
        </div>
      </section>

      <div role="note" className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-[#fff7e9] p-4 text-sm leading-6 text-[#754321]">
        <LockKeyhole className="mt-0.5 shrink-0" size={20}/><div><strong>Before testing real submissions:</strong> The lecturer and administrator must verify test accounts, authentication, permissions, backups, and the backend before enabling writes. Until then, use the demo and share UX feedback only. Never enter interviewee identities, passwords, or real student information.</div>
      </div>

      <section className="mt-10 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8" aria-label="Student pilot instructions">
        <SectionHeading number="01 · STUDENTS" title="Follow these six steps" description="Each team works independently. Ideally one tests on desktop and the other on a phone."/>
        <ol className="space-y-5">
          {studentSteps.map((step,i)=><li key={step.title} className="flex gap-4 border-b border-[#edf0eb] pb-5 last:border-0 last:pb-0">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dceee6] text-sm font-black">{i+1}</span>
            <div className="min-w-0 flex-1"><h3 className="font-extrabold">{step.title}</h3><p className="mt-1 text-sm leading-7 text-[#52656b]">{step.body}</p>{step.href && <Link href={step.href} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-[#0f6754] underline underline-offset-4">{step.label}<ArrowRight size={16}/></Link>}</div>
          </li>)}
        </ol>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8" aria-label="Lecturer pilot instructions">
        <SectionHeading number="02 · LECTURER" title="Verify the feedback and revision cycle" description="Requires a verified Lecturer account and two test teams provisioned in the backend."/>
        <ol className="space-y-4">{teacherSteps.map((step,i)=><li key={step.title} className="flex gap-3 text-sm leading-7"><span className="font-black text-[#0f6754]">{i+1}.</span><div><strong>{step.title}.</strong> <span className="text-[#52656b]">{step.body}</span></div></li>)}</ol>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173445] px-4 py-3 text-sm font-bold text-white"><Users size={18}/> Classroom Board</Link><Link href="/review" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#9bbaae] px-4 py-3 text-sm font-bold text-[#173445]"><FileCheck2 size={18}/> Submission Review</Link></div>
        <p className="mt-4 text-xs leading-6 text-[#647579]">Project rubric: Problem 30%, Solution 30%, Creativity 15%, Presentation 10%, Q&A 15%. Overall course grades are assessed separately.</p>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#e0e7df] bg-white p-5 sm:p-8">
        <SectionHeading number="03 · UX FEEDBACK" title="Five questions to answer after testing" description="Copy these questions into a message to your lecturer or the development team. No extra form or account is required."/>
        <div className="rounded-2xl bg-[#f1f6f2] p-4 sm:p-5"><ol className="space-y-3 text-sm leading-7">{feedbackQuestions.map(q=><li key={q}>{q}</li>)}</ol></div>
        <p className="mt-4 text-sm leading-6 text-[#52656b]">For errors, note the URL, the action that triggered the issue, the message, and your device. Share only screenshots with emails, names, private team details, and authentication tokens removed.</p>
      </section>

      <section className="mt-6 rounded-[24px] border border-[#d8e6dc] bg-[#eaf4eb] p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={21}/> What counts as a successful pilot?</h2>
        <p className="mt-3 text-sm leading-7 text-[#3d5d54]">A student can independently find the task, save without losing data after reload, submit a real snapshot, receive lecturer feedback, and create a new version. Other teams cannot access private evidence. Mark any failed core step as NOT PASSED, never as complete.</p>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#647579]">
        <span>UII Design Thinking Hub · Pilot instructions · no student roster included</span>
        <Link href="/classroom" className="inline-flex min-h-11 items-center gap-2 font-bold text-[#173445]"><ClipboardCheck size={16}/> Return to Classroom <ArrowRight size={16}/></Link>
      </footer>
    </div>
  </main>;
}
