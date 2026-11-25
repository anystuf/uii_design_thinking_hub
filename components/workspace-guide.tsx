"use client";

import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { useRef, useState } from "react";

export type WorkspaceRole = "STUDENT" | "LECTURER" | "ADMIN" | "MENTOR";
type Guide = { question: string; steps: string[]; href: string; action: string };
const login: Guide = {
  question: "How do I get started?",
  steps: ["Open Sign in. Use your email and password, or Google if available.", "If you create an account, confirm your email. Lecturer and administrator access must be assigned by authorized staff."],
  href: "/learn", action: "Open Sign in",
};
const student: Guide[] = [
  { question: "Where do I start or resume learning?", steps: ["Open Courses, choose an available course, and select Enroll.", "Use Dashboard to resume your next lesson. Mark it complete when finished to save progress."], href: "/learn#course-catalog", action: "Find a course" },
  { question: "How do I join a project team?", steps: ["Enroll first, then open Projects and choose a related challenge.", "Create a team or accept an invitation. Choose a Design Thinking activity appropriate to your project stage."], href: "/studio", action: "Open Projects" },
  { question: "Where do I submit work and read feedback?", steps: ["In Evidence & Feedback, choose your project and save a file or team notes.", "Select evidence versions to submit. When feedback arrives, open Notifications to review and revise."], href: "/evidence", action: "Open Evidence" },
];
const teaching: Guide[] = [
  { question: "How do I publish a course?", steps: ["Open Courses and create a draft.", "Add lessons to the draft, then publish lessons and the course when ready."], href: "/learn", action: "Manage courses" },
  { question: "How do I assign a classroom challenge?", steps: ["Open Projects, choose a course you manage, and create a challenge.", "Specify the deliverables and milestones, then publish for students to join."], href: "/studio", action: "Manage challenges" },
  { question: "How do I review submissions and give feedback?", steps: ["Open Submission Review, select a challenge, and publish the rubric.", "Choose a pending submission, assess against the rubric, and explain the next improvement before publishing feedback."], href: "/review", action: "Open review queue" },
];
const admin: Guide = {
  question: "Where can I review accounts and permissions?",
  steps: ["Open Administration to view recorded accounts and roles.", "Use your institution's authorized process to grant or change roles."],
  href: "/admin", action: "View accounts",
};
const mentor: Guide = {
  question: "Where can I find projects shared with me?",
  steps: ["Open Projects to view projects your account may access.", "If no project appears, ask the course lecturer to check your access."],
  href: "/studio", action: "Open Projects",
};
const guides = { STUDENT: student, LECTURER: teaching, ADMIN: [admin, ...teaching], MENTOR: [mentor] };

export function WorkspaceGuide({ role, triggerClassName }: { role?: WorkspaceRole; triggerClassName?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Guide | null>(null);
  const topics = role ? guides[role] : [login];
  return (
    <>
      <button type="button" onClick={() => { setSelected(null); dialog.current?.showModal(); }}
        className={"flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold " + (triggerClassName ?? "text-slate-700 hover:bg-slate-100")}>
        <MessageCircle aria-hidden="true" size={17}/> <span>Help</span>
      </button>
      <dialog ref={dialog} aria-labelledby="workspace-guide-title"
        className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/45">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 id="workspace-guide-title" className="text-base font-semibold">How to use the hub</h2>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close guide"
            className="grid size-11 place-items-center rounded-md hover:bg-slate-100"><X size={18} aria-hidden="true"/></button>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm text-slate-600">What would you like to do?</p>
          <div className="grid gap-2">
            {topics.map(topic => (
              <button key={topic.question} type="button" onClick={() => setSelected(topic)} aria-pressed={selected === topic}
                className="min-h-11 rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 aria-pressed:border-blue-700 aria-pressed:bg-blue-50">
                {topic.question}
              </button>
            ))}
          </div>
          {selected && topics.includes(selected) && (
            <div className="rounded-lg bg-slate-50 p-3">
              <ol aria-live="polite" className="list-decimal space-y-2 pl-5 text-sm leading-6">
                {selected.steps.map(step => <li key={step}>{step}</li>)}
              </ol>
              <Link href={selected.href} onClick={() => dialog.current?.close()}
                className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#153b77] underline">{selected.action}</Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
