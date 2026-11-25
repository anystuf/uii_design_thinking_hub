"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, HelpCircle, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { authenticatedApi as api } from "@/lib/authenticated-api";

type Kind = "QUIZ" | "WRITTEN" | "PROJECT";
type Question = {
  id: string; prompt: string; options: string[]; correctIndex?: number;
  explanation?: string; points: number;
};
type Exercise = {
  id: string; lessonId: string; kind: Kind; title: string; instructions: string;
  items: Question[]; passingScore: number; maxAttempts: number; dueAt: string | null;
  publishedAt: string | null;
};
type Attempt = {
  id: string; status: "GRADED" | "NEEDS_REVIEW"; score: number | null;
  feedback: string | null; answers: { answerIndexes?: number[]; responseText?: string; projectId?: string };
  createdAt: string; user?: { id: string; fullName: string };
};
type Project = { id: string; title: string; courseId: string };
const newQuestion = (id = "1"): Question => ({
  id,
  prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", points: 1,
});

export function LessonPractice({
  lessonId, courseId, token, canManage, isEnrolled,
}: {
  lessonId: string; courseId: string; token: string; canManage: boolean; isEnrolled: boolean;
}) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [ungradedChoice, setUngradedChoice] = useState<number | null>(null);
  const [kind, setKind] = useState<Kind>("QUIZ");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [published, setPublished] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [responseText, setResponseText] = useState("");
  const [projectId, setProjectId] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [latest, setLatest] = useState<Attempt | null>(null);
  const [reload, setReload] = useState(0);
  const [checkedAt, setCheckedAt] = useState(0);

  useEffect(() => {
    if (!token || (!canManage && !isEnrolled)) {
      setExercise(null); setAttempts([]); setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true); setError(""); setExercise(null); setAttempts([]); setLatest(null); setEditing(false);
    async function load() {
      try {
        const found = await api<Exercise | null>("/lessons/" + encodeURIComponent(lessonId) + "/exercise", token);
        if (!alive) return;
        const valid = found && !Array.isArray(found) && typeof found.id === "string" && Array.isArray(found.items) ? found : null;
        setExercise(valid);
        setCheckedAt(Date.now());
        if (valid) {
          setKind(valid.kind); setTitle(valid.title); setInstructions(valid.instructions);
          setQuestions(valid.items.length ? valid.items : [newQuestion()]);
          setPassingScore(valid.passingScore); setMaxAttempts(valid.maxAttempts);
          setPublished(!!valid.publishedAt);
          setDueAt(valid.dueAt ? new Date(valid.dueAt).toISOString().slice(0, 16) : "");
          const fetched = await api<Attempt[]>("/exercises/" + encodeURIComponent(valid.id) + "/attempts" + (canManage ? "" : "/me"), token);
          if (alive) setAttempts(fetched);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Could not load practice exercises.");
      } finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, [lessonId, token, canManage, isEnrolled, reload]);

  useEffect(() => {
    if (kind !== "PROJECT" || !isEnrolled || !token || canManage) return;
    let alive = true;
    void api<Project[]>("/projects", token).then(items => {
      if (alive) setProjects(items.filter(item => item.courseId === courseId));
    }).catch(() => { if (alive) setProjects([]); });
    return () => { alive = false; };
  }, [kind, isEnrolled, canManage, courseId, token]);

  /** Fill the editor, but never persist or publish without lecturer action. */
  function loadExample(kindToLoad: Kind) {
    setKind(kindToLoad);
    setPublished(false);
    setMaxAttempts(3);
    setPassingScore(70);
    setDueAt("");
    if (kindToLoad === "QUIZ") {
      setTitle("Design Thinking Basics Quiz · Sample");
      setInstructions("Choose the best answer for each question. After submitting, review the explanation and apply it to a real situation.");
      setQuestions([
        {id:"demo-1",prompt:"What is the main purpose of Design Thinking?",options:["Memorizing theory","Solving human-centred problems","Writing code faster","Replacing all meetings"],correctIndex:1,explanation:"Design Thinking focuses on user needs and improving solutions using evidence.",points:1},
        {id:"demo-2",prompt:"Which stage focuses on understanding people?",options:["Test","Define","Empathize","Prototype"],correctIndex:2,explanation:"Empathize helps uncover real experiences and needs.",points:1},
        {id:"demo-3",prompt:"What should an initial prototype be?",options:["A finished product","A model that helps you learn from users","An advertising campaign","A final grade sheet"],correctIndex:1,explanation:"Prototyping prioritizes learning quickly rather than perfecting a product.",points:1},
        {id:"demo-4",prompt:"What does testing provide to your team?",options:["Guaranteed success","Feedback for improvement","Eliminating user needs","Replacing ideation"],correctIndex:1,explanation:"Testing provides evidence to revisit problem framing, ideas, or prototypes.",points:1},
        {id:"demo-5",prompt:"How does the Design Thinking process work?",options:["Always follows a strict linear sequence","Flexible and iterative","Only for professional designers","Only for businesses"],correctIndex:1,explanation:"The five stages are not mandatory gates in a fixed order.",points:1},
      ]);
    } else if (kindToLoad === "WRITTEN") {
      setTitle("Observation Reflection · Sample");
      setInstructions("Observe a campus service experience for about 15 minutes. Write 150–200 words about what users do, where they struggle, which feelings are assumptions, and one unmet need. Do not include identifying personal data. Suggested rubric: Observation 30, insight 30, user focus 20, clarity 20.");
      setQuestions([newQuestion()]);
    } else {
      setTitle("Low-Fidelity Prototype Challenge · Sample");
      setInstructions("Create a paper prototype or storyboard for your team's idea. Prepare one prototype image, a short description, three assumptions to test, and three insights from feedback. For real coursework, link to an authorized project and submit evidence through Evidence.");
      setQuestions([newQuestion()]);
    }
    setNotice("Sample content loaded into the form. Edit and review the answers, then select Save Exercise; nothing is published automatically.");
    setError("");
  }

  function reviseQuestion(index: number, patch: Partial<Question>) {
    setQuestions(items => items.map((item, i) => i === index ? { ...item, ...patch } : item));
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const data = await api<Exercise>("/lessons/" + encodeURIComponent(lessonId) + "/exercise", token, {
        method: "PUT",
        body: JSON.stringify({
          kind, title: title.trim(), instructions: instructions.trim(),
          items: kind === "QUIZ" ? questions.map(q => ({
            prompt: q.prompt, options: q.options, correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation ?? "", points: q.points,
          })) : [],
          passingScore, maxAttempts, published,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        }),
      });
      setExercise(data); setEditing(false); setNotice("Practice exercise saved.");
      setReload(n => n + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the exercise."); }
    finally { setSaving(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!exercise) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const body = exercise.kind === "QUIZ"
        ? { answerIndexes: exercise.items.map((_, i) => answers[i] ?? -1) }
        : { responseText, ...(exercise.kind === "PROJECT" ? { projectId } : {}) };
      const record = await api<Attempt>("/exercises/" + encodeURIComponent(exercise.id) + "/attempts", token, {
        method: "POST", body: JSON.stringify(body),
      });
      setLatest(record); setAttempts(current => [record, ...current]);
      window.dispatchEvent(new Event("uii:learning-progress-changed"));
      setNotice(record.status === "GRADED" ? "Submitted and automatically graded." : "Submission received. Await lecturer assessment.");
      setAnswers([]); setResponseText(""); setProjectId("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not submit the exercise."); }
    finally { setSaving(false); }
  }

  if (!canManage && !isEnrolled) return null;
  const attemptLimitReached = !!exercise && attempts.length >= exercise.maxAttempts;
  const deadlinePassed = !!exercise?.dueAt && Date.parse(exercise.dueAt) < checkedAt;
  const canSubmit = !attemptLimitReached && !deadlinePassed;
  return <section id="lesson-practice" aria-labelledby="lesson-practice-heading"
    className="space-y-5 rounded-[22px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#b94708]">PRACTICE · ASSESS · IMPROVE</p>
        <h3 id="lesson-practice-heading" className="mt-1 text-xl font-extrabold sm:text-2xl">Practice & Exercises</h3>
        <p className="mt-2 text-sm text-slate-600">Reinforce your understanding through practice and feedback.</p>
      </div>
      {!loading && canManage && !editing && <button type="button" onClick={() => setEditing(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">
        <Plus size={17}/>{exercise ? "Edit exercise" : "Create exercise"}
      </button>}
    </div>
    {loading && <p role="status" className="text-sm text-slate-600">Loading exercise…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}
      <button type="button" onClick={() => setReload(n => n + 1)} className="ml-2 font-bold underline">Retry</button></div>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {!loading && !exercise && !editing && <div className="rounded-2xl border border-[#d3e6d5] bg-[#f5fbf4] p-5 text-sm">
      {canManage ? <p className="text-[#4d6570]">Chưa có bài tập được công bố. Giảng viên có thể dùng nút Create exercise để thêm quiz và bài thực hành được lưu vào LMS.</p> :
        <div className="space-y-4">
          <div><p className="text-[11px] font-black uppercase tracking-[.12em] text-[#a54733]">TRY · REFLECT · TRY AGAIN</p>
            <h4 className="mt-1 text-lg font-black text-[#173445]">Try a quick practice question</h4>
            <p className="mt-1 text-xs leading-6 text-[#546e71]">Your lecturer has not published a graded exercise for this lesson. This self-check does not affect grades, is not saved to the LMS, and does not replace assigned work.</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 font-bold text-[#173445]">When solving a campus problem, what should your team do first?</legend>
            {["Immediately build an app based on the team's idea", "Observe and interview real users to understand their experience", "Rely entirely on team assumptions"].map((option,i)=>
              <label key={option} className={"flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm leading-6 "+(ungradedChoice===i?"border-[#b95237] ring-1 ring-[#e4a28b]":"border-[#d7e4db]")}>
                <input type="radio" name="uii-self-check" checked={ungradedChoice===i} onChange={()=>setUngradedChoice(i)} className="mt-1.5"/>
                <span>{option}</span>
              </label>)}
          </fieldset>
          {ungradedChoice!==null&&<p role="status" className={"rounded-xl p-3 text-sm leading-6 "+(ungradedChoice===1?"bg-[#d7f0df] text-[#22553b]":"bg-[#ffe7d7] text-[#7f4130]")}>
            {ungradedChoice===1?"Correct! Empathize starts by understanding people, not choosing a solution. Use the Design Thinking map to capture observations.":"Not quite. Design Thinking requires evidence of real needs before choosing solutions."}
          </p>}
          <div className="flex flex-wrap items-center gap-3">
            <a href="#quest-compass-title" className="inline-flex min-h-11 items-center rounded-full bg-[#173445] px-4 text-xs font-black text-white">Choose a tool on the Design Thinking map</a>
            <button type="button" onClick={()=>setUngradedChoice(null)} className="inline-flex min-h-11 items-center rounded-full border border-[#b9d2c8] bg-white px-4 text-xs font-black text-[#173445]">Retry</button>
          </div>
        </div>}
    </div>}
    {!loading && canManage && editing && <form onSubmit={event => void save(event)} className="space-y-5 rounded-2xl bg-slate-50 p-4 sm:p-6">
      <div className="rounded-xl border border-[#f3d0b5] bg-[#fff7ec] p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#a44b25]">Exercise templates · Nothing is saved automatically</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">Choose a template, adapt it for your course, and select Save. Templates are unpublished by default.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => loadExample("QUIZ")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Sample quiz · 5 questions</button>
          <button type="button" onClick={() => loadExample("WRITTEN")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Sample reflection</button>
          <button type="button" onClick={() => loadExample("PROJECT")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Sample project</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Exercise type
          <select value={kind} onChange={e => setKind(e.target.value as Kind)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="QUIZ">Multiple-choice quiz (auto-graded)</option>
            <option value="WRITTEN">Written reflection (lecturer-graded)</option>
            <option value="PROJECT">Project task (with evidence)</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Exercise title
          <input required minLength={3} maxLength={180} value={title} onChange={e => setTitle(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"/></label>
      </div>
      <label className="block text-sm font-semibold">Instructions
        <textarea value={instructions} maxLength={6000} onChange={e => setInstructions(e.target.value)}
          rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
      {kind === "QUIZ" && <fieldset className="space-y-4">
        <legend className="text-base font-extrabold">Question bank ({questions.length}/20)</legend>
        {questions.map((q, index) => <div key={q.id} className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between gap-3"><strong>Question {index + 1}</strong>
            {questions.length > 1 && <button type="button" aria-label={"Delete question " + (index + 1)}
              onClick={() => setQuestions(items => items.filter(item => item.id !== q.id))}
              className="min-h-11 rounded-lg border px-3 text-red-700"><Trash2 size={16}/></button>}
          </div>
          <label className="block text-sm font-semibold">Question text
            <textarea required minLength={4} maxLength={1000} value={q.prompt}
              onChange={e => reviseQuestion(index, { prompt: e.target.value })}
              className="mt-1 w-full rounded-lg border p-3" rows={2}/></label>
          <div className="grid gap-3 sm:grid-cols-2">{q.options.map((option, j) =>
            <label key={j} className="block text-sm font-semibold">Option {String.fromCharCode(65 + j)}
              <input required maxLength={300} value={option}
                onChange={e => reviseQuestion(index, { options: q.options.map((o,k) => k===j ? e.target.value : o) })}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Correct answer
              <select value={q.correctIndex ?? 0} onChange={e => reviseQuestion(index, {correctIndex: Number(e.target.value)})}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">
                {q.options.map((_,j) => <option key={j} value={j}>{String.fromCharCode(65 + j)}</option>)}
              </select></label>
            <label className="block text-sm font-semibold">Question points (1–20)
              <input type="number" min={1} max={20} value={q.points}
                onChange={e => reviseQuestion(index, {points: Number(e.target.value)})}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
          </div>
          <label className="block text-sm font-semibold">Answer explanation (shown after submission)
            <textarea maxLength={1000} value={q.explanation ?? ""} onChange={e => reviseQuestion(index, {explanation: e.target.value})}
              className="mt-1 w-full rounded-lg border p-3" rows={2}/></label>
        </div>)}
        <button type="button" disabled={questions.length>=20} onClick={() => setQuestions(items => [...items,newQuestion(String(Math.max(0, ...items.map(q => Number(q.id) || 0)) + 1))])}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"><Plus size={17}/> Add question</button>
      </fieldset>}
      {kind === "PROJECT" && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6">
        Students save private files/evidence in <Link href="/evidence" className="font-bold underline">Evidence</Link>, sau đó
        select the associated project and describe your work here. The server validates project access.</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold">Passing score (0–100)
          <input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="block text-sm font-semibold">Maximum attempts (1–20)
          <input type="number" min={1} max={20} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="block text-sm font-semibold">Due date (optional)
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={published}
        onChange={e => setPublished(e.target.checked)}/> Publish exercise for students</label>
      <div className="flex flex-wrap gap-2">
        <button disabled={saving} type="submit" className="min-h-11 rounded-xl bg-[#153b77] px-5 text-sm font-bold text-white">Save exercise</button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Cancel</button>
      </div>
      {attempts.length > 0 && <p className="text-sm font-medium text-amber-800">Submissions already exist: questions and answers are locked to preserve history.</p>}
    </form>}

    {!loading && exercise && !editing && <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
          {exercise.kind === "QUIZ" ? "Quiz · Auto-graded" : exercise.kind === "WRITTEN" ? "Written reflection" : "Project task"}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {exercise.publishedAt ? "Published" : "Draft"}</span>
      </div>
      <h4 className="text-lg font-extrabold">{exercise.title}</h4>
      {exercise.instructions && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{exercise.instructions}</p>}
      <p className="text-xs text-slate-600">Passing score: {exercise.passingScore}/100 · Maximum {exercise.maxAttempts} attempts
        {exercise.dueAt ? " · Due: " + new Date(exercise.dueAt).toLocaleString("en-US") : ""}</p>
      {!canManage && <div className="space-y-4">
        {latest && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="font-extrabold">{latest.status==="GRADED" ? "Result: " + latest.score + "/100" : "Submitted · Awaiting lecturer feedback"}</p>
          {latest.feedback && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{latest.feedback}</p>}
        </div>}
        {canSubmit && <form onSubmit={event => void submit(event)} className="space-y-5">
          {exercise.kind === "QUIZ" && <fieldset className="space-y-5">
            <legend className="sr-only">Question hỏi trắc nghiệm</legend>
            {exercise.items.map((q,i) => <div key={q.id} className="rounded-xl border p-4">
              <p className="mb-3 font-bold">Question {i+1}. {q.prompt} <span className="text-xs font-normal text-slate-500">({q.points} points)</span></p>
              <div className="grid gap-2">{q.options.map((option,j) => <label key={j} className={"flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm " + (answers[i]===j ? "border-[#153b77] bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
                <input type="radio" name={"quiz-" + exercise.id + "-" + i} checked={answers[i]===j}
                  onChange={() => setAnswers(items => {const next=[...items]; next[i]=j; return next;})}/>
                <span>{option}</span></label>)}</div>
            </div>)}
          </fieldset>}
          {exercise.kind !== "QUIZ" && <>
            {exercise.kind === "PROJECT" && <div className="space-y-2 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-bold">1. Save your team evidence</p>
              <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#153b77] underline">
                <FileText size={17}/> Open Evidence & Submissions <ArrowRight size={15}/></Link>
              <label className="block text-sm font-semibold">2. Choose the project for this course
                <select required value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">
                  <option value="">Select project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select></label>
              {projects.length===0 && <p className="text-xs text-amber-800">No authorized project is available in this course. Join a team in Design Studio before submitting.</p>}
            </div>}
            <label className="block text-sm font-bold">Your response / explanation
              <textarea required minLength={10} maxLength={10000} rows={7} value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Write your response or describe the evidence you created…" className="mt-2 w-full rounded-xl border p-3 text-base"/></label>
          </>}
          <button disabled={saving} type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-5 text-sm font-bold text-white disabled:opacity-60">
            <Send size={17}/>{saving ? "Submitting…" : "Submit and view result"}
          </button>
        </form>}
        {!canSubmit && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {deadlinePassed ? "The due date has passed." : "Bạn đã sử dụng hết số attempts làm bài."}
        </p>}
        {attempts.length>0 && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-bold">Attempt history ({attempts.length})</summary>
          <ol className="mt-3 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-bold">{new Date(item.createdAt).toLocaleString("en-US")} · {item.status==="GRADED" ? item.score+"/100" : "Awaiting grading"}</p>
            {item.feedback && <p className="mt-2 whitespace-pre-wrap leading-6">{item.feedback}</p>}
          </li>)}</ol></details>}
      </div>}
      {canManage && <div className="space-y-4">
        <button type="button" onClick={() => setShowReview(v=>!v)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold">
          <ClipboardCheck size={18}/> Submitted work ({attempts.length})
        </button>
        {showReview && (attempts.length ? <div className="space-y-4">
          {attempts.map(item => <ReviewCard key={item.id} attempt={item} token={token}
            onReviewed={() => setReload(n=>n+1)}/>)}
        </div> : <p className="text-sm text-slate-600">No students have submitted yet.</p>)}
      </div>}
    </div>}
  </section>;
}

function ReviewCard({ attempt, token, onReviewed }: { attempt: Attempt; token: string; onReviewed: () => void }) {
  const [score, setScore] = useState(70);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/exercise-attempts/" + encodeURIComponent(attempt.id) + "/review", token, {
        method: "PATCH", body: JSON.stringify({score,feedback}),
      });
      onReviewed();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send feedback."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
    <p className="text-sm font-bold">{attempt.user?.fullName ?? "Student"} · {new Date(attempt.createdAt).toLocaleString("en-US")}</p>
    <p className="text-xs text-slate-600">{attempt.status==="GRADED" ? "Graded: " + attempt.score + "/100" : "Not graded"}</p>
    <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6">
      {attempt.answers.responseText || (attempt.answers.answerIndexes ? "Quiz answers were auto-graded." : "No content.")}
    </p>
    {attempt.answers.projectId && <Link className="text-sm font-bold text-[#153b77] underline" href="/evidence">View project evidence</Link>}
    {attempt.feedback && <p className="whitespace-pre-wrap text-sm">{attempt.feedback}</p>}
    {attempt.status === "NEEDS_REVIEW" && <form onSubmit={event => void review(event)} className="space-y-3">
      <label className="block text-sm font-semibold">Score (0–100)
        <input type="number" min={0} max={100} value={score} onChange={e=>setScore(Number(e.target.value))}
          className="mt-1 min-h-11 w-28 rounded-lg border px-3"/></label>
      <label className="block text-sm font-semibold">Feedback for student
        <textarea required minLength={3} maxLength={4000} value={feedback}
          onChange={e=>setFeedback(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border p-3"/></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} type="submit" className="min-h-11 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">
        Gửi points và phản hồi
      </button>
    </form>}
  </div>;
}
