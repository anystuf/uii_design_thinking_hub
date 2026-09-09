"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FileUp,
  MessageSquareText,
  Milestone,
  PanelRight,
  Play,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";

const phases = [
  { name: "Empathize", status: "done", detail: "12 interviews tagged" },
  { name: "Define", status: "active", detail: "HMW evidence due" },
  { name: "Ideate", status: "next", detail: "Concept jam opens Fri" },
  { name: "Prototype", status: "locked", detail: "Awaiting Define review" },
  { name: "Test", status: "locked", detail: "Planned next sprint" },
] as const;

const evidenceItems = [
  { name: "Interview synthesis board", type: "PDF", state: "Approved", size: "2.4 MB" },
  { name: "HMW statement draft", type: "DOCX", state: "Needs update", size: "318 KB" },
  { name: "Assumption map", type: "PNG", state: "Submitted", size: "1.1 MB" },
];

const projectVersions = [
  { label: "v0.4", title: "Define sprint submission", time: "Today 09:42", status: "Current" },
  { label: "v0.3", title: "Insight clustering revision", time: "Yesterday", status: "Reviewed" },
  { label: "v0.2", title: "Interview evidence pack", time: "Mon", status: "Archived" },
];

const critiqueTasks = [
  { team: "Circular Lab", prompt: "Check if their HMW keeps one primary user tension.", due: "Due today" },
  { team: "Delta Team", prompt: "Leave one evidence-based question before rating.", due: "Due Fri" },
];

const teamActivity = [
  { person: "Minh Anh", action: "added a new field quote", time: "8 min ago" },
  { person: "Khoa Le", action: "resolved an assumption card", time: "22 min ago" },
  { person: "Lecturer Mai", action: "requested stronger evidence traceability", time: "1 hour ago" },
];

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-orange">{eyebrow}</p>
        <h2 className="mt-2 font-serifDisplay text-4xl font-bold leading-none tracking-[-0.05em] text-uii-text md:text-5xl">
          {title}
        </h2>
      </div>
      {copy ? <p className="max-w-xl text-sm leading-6 text-uii-muted">{copy}</p> : null}
    </div>
  );
}

function SprintTimeline() {
  return (
    <article className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Sprint phase timeline</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Define is in review prep</h3>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 font-sansUi text-xs font-extrabold text-uii-orange">
          68% complete
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {phases.map((phase, index) => {
          const isActive = phase.status === "active";
          const isDone = phase.status === "done";
          return (
            <div
              key={phase.name}
              className={`relative rounded-[1.1rem] border p-4 ${
                isActive
                  ? "border-uii-orange bg-orange-50"
                  : isDone
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-uii-border bg-uii-bg"
              }`}
              data-sketch="true"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full font-sansUi text-xs font-black ${
                    isActive
                      ? "bg-uii-orange text-white"
                      : isDone
                        ? "bg-uii-success text-white"
                        : "bg-white text-uii-muted"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </span>
                {isActive ? <Milestone className="h-4 w-4 text-uii-orange" /> : null}
              </div>
              <h4 className="mt-4 font-sansUi text-sm font-black text-uii-text">{phase.name}</h4>
              <p className="mt-2 min-h-10 text-xs leading-5 text-uii-muted">{phase.detail}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function CurrentTaskCard() {
  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-uii-border bg-[radial-gradient(circle_at_100%_0%,rgba(243,112,33,0.16),transparent_16rem),linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-orange">Current task</p>
          <h3 className="mt-2 font-sansUi text-2xl font-black tracking-[-0.05em] text-uii-text">Upload How Might We evidence</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-uii-muted">
            Submit one HMW statement with a linked evidence note and one assumption test plan. Lecturer review opens after both files are uploaded.
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-uii-orange text-white">
          <FileUp className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Due", "Today 23:59", Clock3],
          ["Review gate", "Lecturer approval", ShieldCheck],
          ["Peer critique", "2 assigned", MessageSquareText],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-[1rem] border border-uii-border bg-white p-4">
            <Icon className="h-4 w-4 text-uii-orange" />
            <p className="mt-3 font-sansUi text-[11px] font-extrabold uppercase tracking-[0.16em] text-uii-muted">{label as string}</p>
            <p className="mt-1 font-sansUi text-sm font-black text-uii-text">{value as string}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="#evidence-upload"
          className="inline-flex items-center gap-2 rounded-full bg-uii-orange px-5 py-3 font-sansUi text-sm font-extrabold text-white transition hover:bg-uii-orange2"
          data-sketch="true"
        >
          Upload evidence <UploadCloud className="h-4 w-4" />
        </a>
        <button className="inline-flex items-center gap-2 rounded-full border border-uii-border bg-white px-5 py-3 font-sansUi text-sm font-extrabold text-uii-blue transition hover:border-uii-blue" data-sketch="true">
          Open task brief <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function EvidenceUploadZone() {
  const [selectedFileName, setSelectedFileName] = useState("No file selected");

  return (
    <article id="evidence-upload" className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Evidence upload</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Attach sprint proof</h3>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-sansUi text-xs font-extrabold text-uii-blue">PDF, DOCX, PNG, MP4</span>
      </div>

      <label className="block rounded-[1.25rem] border-2 border-dashed border-uii-border bg-uii-bg p-6 text-center transition hover:border-uii-orange" data-sketch="true">
        <input
          type="file"
          className="sr-only"
          onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "No file selected")}
        />
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-uii-orange shadow-soft">
          <UploadCloud className="h-6 w-6" />
        </span>
        <span className="mt-4 block font-sansUi text-base font-black text-uii-text">Drop evidence here or choose a file</span>
        <span className="mt-2 block text-sm leading-6 text-uii-muted">
          Files will later route through the Nest backend, validation layer, Microsoft Graph, SharePoint, and database metadata.
        </span>
        <span className="mt-4 block truncate rounded-full bg-white px-4 py-2 text-xs font-semibold text-uii-muted">{selectedFileName}</span>
      </label>

      <div className="mt-5 grid gap-3">
        {evidenceItems.map((item) => {
          const tone =
            item.state === "Approved"
              ? "bg-emerald-50 text-uii-success"
              : item.state === "Needs update"
                ? "bg-red-50 text-uii-danger"
                : "bg-blue-50 text-uii-blue";
          return (
            <div key={item.name} className="flex items-center justify-between gap-3 rounded-[1rem] border border-uii-border bg-white p-3">
              <span className="min-w-0 flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-uii-orange" />
                <span className="min-w-0">
                  <span className="block truncate font-sansUi text-sm font-black text-uii-text">{item.name}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-uii-muted">{item.type} - {item.size}</span>
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 font-sansUi text-[11px] font-extrabold ${tone}`}>{item.state}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function VersionHistory() {
  return (
    <article className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Project versions</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Submission trail</h3>
        </div>
        <RefreshCcw className="h-4 w-4 text-uii-orange" />
      </div>
      <div className="grid gap-3">
        {projectVersions.map((version) => (
          <div key={version.label} className="rounded-[1rem] border border-uii-border bg-uii-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-sansUi text-sm font-black text-uii-blue">{version.label}</span>
              <span className="rounded-full bg-white px-3 py-1 font-sansUi text-[11px] font-extrabold text-uii-muted">{version.status}</span>
            </div>
            <h4 className="mt-3 font-sansUi text-sm font-black text-uii-text">{version.title}</h4>
            <p className="mt-1 text-xs font-semibold text-uii-muted">{version.time}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function FeedbackPanel() {
  return (
    <article className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Lecturer feedback</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Evidence traceability</h3>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 font-sansUi text-xs font-extrabold text-uii-orange">Action needed</span>
      </div>
      <div className="rounded-[1.15rem] border border-orange-100 bg-orange-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-uii-orange" />
          <p className="text-sm leading-6 text-uii-text">
            Your HMW is promising, but the user tension needs one direct quote from the interview board. Add the quote before submitting the final Define package.
          </p>
        </div>
      </div>
      <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-uii-blue px-4 py-3 font-sansUi text-sm font-extrabold text-white transition hover:bg-[#123372]" data-sketch="true">
        Reply with revision note <Send className="h-4 w-4" />
      </button>
    </article>
  );
}

function PeerCritiquePanel() {
  return (
    <article className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Peer critique</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Assigned reviews</h3>
        </div>
        <Users className="h-4 w-4 text-uii-orange" />
      </div>
      <div className="grid gap-3">
        {critiqueTasks.map((task) => (
          <div key={task.team} className="rounded-[1rem] border border-uii-border bg-uii-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-sansUi text-sm font-black text-uii-text">{task.team}</h4>
              <span className="rounded-full bg-white px-3 py-1 font-sansUi text-[11px] font-extrabold text-uii-orange">{task.due}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-uii-muted">{task.prompt}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function TeamActivityPanel() {
  return (
    <article className="rounded-[1.35rem] border border-uii-border bg-white p-5 shadow-soft">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">Team activity</p>
          <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Recent movement</h3>
        </div>
        <PanelRight className="h-4 w-4 text-uii-orange" />
      </div>
      <div className="grid gap-3">
        {teamActivity.map((event) => (
          <div key={`${event.person}-${event.time}`} className="flex gap-3 rounded-[1rem] border border-uii-border bg-white p-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-uii-orange" />
            <span>
              <span className="block text-sm leading-5 text-uii-text"><strong>{event.person}</strong> {event.action}</span>
              <span className="mt-1 block text-xs font-semibold text-uii-muted">{event.time}</span>
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function ActiveLearningDashboard() {
  return (
    <section id="learning" className="px-5 pb-10 lg:px-7">
      <div className="rounded-[1.6rem] border border-uii-border bg-white p-5 shadow-soft lg:p-7">
        <SectionHeading
          eyebrow="Student sprint workspace"
          title="Work the sprint, not just the course."
          copy="A focused student cockpit for sprint evidence, project versions, lecturer feedback, peer critique, and team movement."
        />

        <div className="mt-8 grid gap-4">
          <SprintTimeline />
          <CurrentTaskCard />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <EvidenceUploadZone />
          <div className="grid gap-4">
            <VersionHistory />
            <FeedbackPanel />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PeerCritiquePanel />
          <TeamActivityPanel />
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-uii-border bg-uii-bg p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-uii-orange shadow-soft">
                <Sparkles className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-sansUi text-sm font-black text-uii-text">Studio handoff ready</span>
                <span className="mt-1 block text-xs leading-5 text-uii-muted">Next sprint can connect this workspace to the Nest backend and SharePoint evidence route.</span>
              </span>
            </span>
            <button className="inline-flex w-fit items-center gap-2 rounded-full border border-uii-border bg-white px-4 py-2.5 font-sansUi text-xs font-extrabold text-uii-blue transition hover:border-uii-blue" data-sketch="true">
              Review checklist <Play className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
