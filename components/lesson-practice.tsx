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
        if (alive) setError(err instanceof Error ? err.message : "Không thể tải bài luyện tập.");
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
      setTitle("Design Thinking Basics Quiz · Bản mẫu");
      setInstructions("Chọn đáp án phù hợp nhất cho mỗi câu. Sau khi nộp, xem giải thích rồi áp dụng vào một tình huống thực tế.");
      setQuestions([
        {id:"demo-1",prompt:"Mục tiêu chính của Design Thinking là gì?",options:["Ghi nhớ lý thuyết","Giải quyết vấn đề lấy con người làm trung tâm","Viết code nhanh hơn","Thay thế mọi cuộc họp"],correctIndex:1,explanation:"Design Thinking tập trung vào nhu cầu người dùng và cải tiến dựa trên bằng chứng.",points:1},
        {id:"demo-2",prompt:"Chế độ nào tập trung vào việc thấu hiểu con người?",options:["Test","Define","Empathize","Prototype"],correctIndex:2,explanation:"Empathize giúp tìm hiểu trải nghiệm và nhu cầu thực tế.",points:1},
        {id:"demo-3",prompt:"Một nguyên mẫu ban đầu nên là gì?",options:["Sản phẩm hoàn thiện","Mô hình đủ để học từ người dùng","Chiến dịch quảng cáo","Bảng điểm cuối kỳ"],correctIndex:1,explanation:"Prototype ưu tiên học nhanh thay vì hoàn thiện ngay.",points:1},
        {id:"demo-4",prompt:"Thử nghiệm mang lại điều gì cho nhóm?",options:["Bảo đảm thành công","Phản hồi để cải tiến","Loại bỏ nhu cầu người dùng","Thay thế giai đoạn phát ý tưởng"],correctIndex:1,explanation:"Test cung cấp dữ liệu để quay lại điều chỉnh định nghĩa, ý tưởng hoặc nguyên mẫu.",points:1},
        {id:"demo-5",prompt:"Quy trình Design Thinking vận hành như thế nào?",options:["Luôn theo một chiều cố định","Linh hoạt, có thể lặp lại","Chỉ dành cho người làm thiết kế","Chỉ dành cho doanh nghiệp"],correctIndex:1,explanation:"Năm chế độ không phải năm cổng bắt buộc đi theo thứ tự.",points:1},
      ]);
    } else if (kindToLoad === "WRITTEN") {
      setTitle("Observation Reflection · Bản mẫu");
      setInstructions("Quan sát một trải nghiệm dịch vụ trong trường khoảng 15 phút. Viết 150–200 từ: người dùng làm gì; gặp khó khăn ở đâu; cảm xúc nào chỉ là suy đoán; một nhu cầu chưa được đáp ứng. Tránh nhập dữ liệu nhận dạng cá nhân. Gợi ý rubric: Quan sát 30, insight 30, tập trung người dùng 20, diễn đạt 20.");
      setQuestions([newQuestion()]);
    } else {
      setTitle("Low-Fidelity Prototype Challenge · Bản mẫu");
      setInstructions("Tạo một nguyên mẫu giấy hoặc storyboard cho ý tưởng nhóm. Chuẩn bị 1 hình ảnh nguyên mẫu, 1 đoạn mô tả ngắn, 3 giả định cần thử và 3 phát hiện từ phản hồi. Khi sử dụng thật, liên kết với dự án/nhóm được phép truy cập và nộp minh chứng qua Evidence.");
      setQuestions([newQuestion()]);
    }
    setNotice("Đã nạp nội dung mẫu vào biểu mẫu. Hãy chỉnh sửa, kiểm duyệt đáp án và chủ động bấm Lưu bài tập; không tự công bố.");
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
      setExercise(data); setEditing(false); setNotice("Đã lưu bài luyện tập.");
      setReload(n => n + 1);
    } catch (err) { setError(err instanceof Error ? err.message : "Không lưu được bài tập."); }
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
      setNotice(record.status === "GRADED" ? "Đã nộp và chấm bài tự động." : "Đã gửi bài. Hãy đợi giảng viên đánh giá.");
      setAnswers([]); setResponseText(""); setProjectId("");
    } catch (err) { setError(err instanceof Error ? err.message : "Không nộp được bài."); }
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
        <h3 id="lesson-practice-heading" className="mt-1 text-xl font-extrabold sm:text-2xl">Luyện tập và bài tập</h3>
        <p className="mt-2 text-sm text-slate-600">Củng cố kiến thức, thực hành và nhận phản hồi để cải thiện.</p>
      </div>
      {!loading && canManage && !editing && <button type="button" onClick={() => setEditing(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">
        <Plus size={17}/>{exercise ? "Chỉnh sửa bài tập" : "Tạo bài tập"}
      </button>}
    </div>
    {loading && <p role="status" className="text-sm text-slate-600">Đang tải bài tập…</p>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}
      <button type="button" onClick={() => setReload(n => n + 1)} className="ml-2 font-bold underline">Thử lại</button></div>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {!loading && !exercise && !editing && <div className="rounded-xl border border-dashed p-5 text-sm text-slate-600">
      {canManage ? "Chưa có bài tập cho bài học này. Chọn Tạo bài tập để thêm quiz hoặc bài thực hành." :
        "Giảng viên chưa công bố bài tập cho bài học này."}
    </div>}
    {!loading && canManage && editing && <form onSubmit={event => void save(event)} className="space-y-5 rounded-2xl bg-slate-50 p-4 sm:p-6">
      <div className="rounded-xl border border-[#f3d0b5] bg-[#fff7ec] p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#a44b25]">Bộ bài tập mẫu · Chỉ điền biểu mẫu, không lưu tự động</p>
        <p className="mt-1 text-xs leading-6 text-slate-600">Chọn một mẫu có sẵn, chỉnh sửa theo khóa học rồi bấm Lưu. Mặc định các mẫu chưa được công bố.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => loadExample("QUIZ")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Quiz mẫu · 5 câu</button>
          <button type="button" onClick={() => loadExample("WRITTEN")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Tự luận mẫu</button>
          <button type="button" onClick={() => loadExample("PROJECT")} className="min-h-11 rounded-full border border-[#cb865f] bg-white px-4 text-xs font-extrabold text-[#753f25]">Dự án mẫu</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Hình thức
          <select value={kind} onChange={e => setKind(e.target.value as Kind)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
            <option value="QUIZ">Quiz trắc nghiệm (tự chấm)</option>
            <option value="WRITTEN">Tự luận (giảng viên chấm)</option>
            <option value="PROJECT">Bài dự án (gắn minh chứng)</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">Tiêu đề bài tập
          <input required minLength={3} maxLength={180} value={title} onChange={e => setTitle(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"/></label>
      </div>
      <label className="block text-sm font-semibold">Hướng dẫn thực hiện
        <textarea value={instructions} maxLength={6000} onChange={e => setInstructions(e.target.value)}
          rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-3"/></label>
      {kind === "QUIZ" && <fieldset className="space-y-4">
        <legend className="text-base font-extrabold">Ngân hàng câu hỏi ({questions.length}/20)</legend>
        {questions.map((q, index) => <div key={q.id} className="space-y-3 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between gap-3"><strong>Câu {index + 1}</strong>
            {questions.length > 1 && <button type="button" aria-label={"Xóa câu " + (index + 1)}
              onClick={() => setQuestions(items => items.filter(item => item.id !== q.id))}
              className="min-h-11 rounded-lg border px-3 text-red-700"><Trash2 size={16}/></button>}
          </div>
          <label className="block text-sm font-semibold">Nội dung câu hỏi
            <textarea required minLength={4} maxLength={1000} value={q.prompt}
              onChange={e => reviseQuestion(index, { prompt: e.target.value })}
              className="mt-1 w-full rounded-lg border p-3" rows={2}/></label>
          <div className="grid gap-3 sm:grid-cols-2">{q.options.map((option, j) =>
            <label key={j} className="block text-sm font-semibold">Lựa chọn {String.fromCharCode(65 + j)}
              <input required maxLength={300} value={option}
                onChange={e => reviseQuestion(index, { options: q.options.map((o,k) => k===j ? e.target.value : o) })}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>)}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Đáp án đúng
              <select value={q.correctIndex ?? 0} onChange={e => reviseQuestion(index, {correctIndex: Number(e.target.value)})}
                className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">
                {q.options.map((_,j) => <option key={j} value={j}>{String.fromCharCode(65 + j)}</option>)}
              </select></label>
            <label className="block text-sm font-semibold">Điểm câu hỏi (1–20)
              <input type="number" min={1} max={20} value={q.points}
                onChange={e => reviseQuestion(index, {points: Number(e.target.value)})}
                className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
          </div>
          <label className="block text-sm font-semibold">Giải thích đáp án (hiển thị sau khi nộp)
            <textarea maxLength={1000} value={q.explanation ?? ""} onChange={e => reviseQuestion(index, {explanation: e.target.value})}
              className="mt-1 w-full rounded-lg border p-3" rows={2}/></label>
        </div>)}
        <button type="button" disabled={questions.length>=20} onClick={() => setQuestions(items => [...items,newQuestion(String(Math.max(0, ...items.map(q => Number(q.id) || 0)) + 1))])}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"><Plus size={17}/> Thêm câu hỏi</button>
      </fieldset>}
      {kind === "PROJECT" && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6">
        Sinh viên lưu tệp/minh chứng riêng tư trong <Link href="/evidence" className="font-bold underline">Minh chứng</Link>, sau đó
        chọn dự án liên quan và gửi phần mô tả công việc tại đây. Quyền truy cập dự án được kiểm tra tại server.</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold">Điểm đạt (0–100)
          <input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="block text-sm font-semibold">Số lượt làm (1–20)
          <input type="number" min={1} max={20} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
        <label className="block text-sm font-semibold">Hạn nộp (không bắt buộc)
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border px-3"/></label>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={published}
        onChange={e => setPublished(e.target.checked)}/> Công bố bài tập cho sinh viên</label>
      <div className="flex flex-wrap gap-2">
        <button disabled={saving} type="submit" className="min-h-11 rounded-xl bg-[#153b77] px-5 text-sm font-bold text-white">Lưu bài tập</button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Hủy</button>
      </div>
      {attempts.length > 0 && <p className="text-sm font-medium text-amber-800">Đã có bài nộp: nội dung và đáp án sẽ bị khóa để bảo toàn lịch sử.</p>}
    </form>}

    {!loading && exercise && !editing && <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
          {exercise.kind === "QUIZ" ? "Trắc nghiệm · Tự chấm" : exercise.kind === "WRITTEN" ? "Tự luận" : "Bài tập dự án"}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {exercise.publishedAt ? "Đã công bố" : "Bản nháp"}</span>
      </div>
      <h4 className="text-lg font-extrabold">{exercise.title}</h4>
      {exercise.instructions && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{exercise.instructions}</p>}
      <p className="text-xs text-slate-600">Điểm đạt: {exercise.passingScore}/100 · Tối đa {exercise.maxAttempts} lượt
        {exercise.dueAt ? " · Hạn nộp: " + new Date(exercise.dueAt).toLocaleString("vi-VN") : ""}</p>
      {!canManage && <div className="space-y-4">
        {latest && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="font-extrabold">{latest.status==="GRADED" ? "Kết quả: " + latest.score + "/100" : "Đã gửi bài · Chờ giảng viên phản hồi"}</p>
          {latest.feedback && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{latest.feedback}</p>}
        </div>}
        {canSubmit && <form onSubmit={event => void submit(event)} className="space-y-5">
          {exercise.kind === "QUIZ" && <fieldset className="space-y-5">
            <legend className="sr-only">Câu hỏi trắc nghiệm</legend>
            {exercise.items.map((q,i) => <div key={q.id} className="rounded-xl border p-4">
              <p className="mb-3 font-bold">Câu {i+1}. {q.prompt} <span className="text-xs font-normal text-slate-500">({q.points} điểm)</span></p>
              <div className="grid gap-2">{q.options.map((option,j) => <label key={j} className={"flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm " + (answers[i]===j ? "border-[#153b77] bg-blue-50" : "border-slate-200 hover:bg-slate-50")}>
                <input type="radio" name={"quiz-" + exercise.id + "-" + i} checked={answers[i]===j}
                  onChange={() => setAnswers(items => {const next=[...items]; next[i]=j; return next;})}/>
                <span>{option}</span></label>)}</div>
            </div>)}
          </fieldset>}
          {exercise.kind !== "QUIZ" && <>
            {exercise.kind === "PROJECT" && <div className="space-y-2 rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-bold">1. Lưu minh chứng của nhóm</p>
              <Link href="/evidence" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#153b77] underline">
                <FileText size={17}/> Mở nơi nộp tệp và minh chứng <ArrowRight size={15}/></Link>
              <label className="block text-sm font-semibold">2. Chọn dự án trong khóa học
                <select required value={projectId} onChange={e => setProjectId(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">
                  <option value="">Chọn dự án</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select></label>
              {projects.length===0 && <p className="text-xs text-amber-800">Chưa tìm thấy dự án bạn có quyền truy cập trong khóa này. Vào Design Studio để tham gia nhóm trước khi nộp.</p>}
            </div>}
            <label className="block text-sm font-bold">Bài làm / Phần giải thích của bạn
              <textarea required minLength={10} maxLength={10000} rows={7} value={responseText}
                onChange={e => setResponseText(e.target.value)}
                placeholder="Viết nội dung hoặc mô tả minh chứng đã tạo…" className="mt-2 w-full rounded-xl border p-3 text-base"/></label>
          </>}
          <button disabled={saving} type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#b94708] px-5 text-sm font-bold text-white disabled:opacity-60">
            <Send size={17}/>{saving ? "Đang nộp…" : "Nộp bài và xem kết quả"}
          </button>
        </form>}
        {!canSubmit && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {deadlinePassed ? "Đã hết hạn nộp." : "Bạn đã sử dụng hết số lượt làm bài."}
        </p>}
        {attempts.length>0 && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer font-bold">Lịch sử làm bài ({attempts.length})</summary>
          <ol className="mt-3 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-bold">{new Date(item.createdAt).toLocaleString("vi-VN")} · {item.status==="GRADED" ? item.score+"/100" : "Đang chờ chấm"}</p>
            {item.feedback && <p className="mt-2 whitespace-pre-wrap leading-6">{item.feedback}</p>}
          </li>)}</ol></details>}
      </div>}
      {canManage && <div className="space-y-4">
        <button type="button" onClick={() => setShowReview(v=>!v)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold">
          <ClipboardCheck size={18}/> Bài đã nộp ({attempts.length})
        </button>
        {showReview && (attempts.length ? <div className="space-y-4">
          {attempts.map(item => <ReviewCard key={item.id} attempt={item} token={token}
            onReviewed={() => setReload(n=>n+1)}/>)}
        </div> : <p className="text-sm text-slate-600">Chưa có sinh viên nộp bài.</p>)}
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
    } catch (err) { setError(err instanceof Error ? err.message : "Không gửi được phản hồi."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
    <p className="text-sm font-bold">{attempt.user?.fullName ?? "Sinh viên"} · {new Date(attempt.createdAt).toLocaleString("vi-VN")}</p>
    <p className="text-xs text-slate-600">{attempt.status==="GRADED" ? "Đã chấm: " + attempt.score + "/100" : "Chưa chấm"}</p>
    <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm leading-6">
      {attempt.answers.responseText || (attempt.answers.answerIndexes ? "Đáp án trắc nghiệm đã được chấm tự động." : "Không có nội dung.")}
    </p>
    {attempt.answers.projectId && <Link className="text-sm font-bold text-[#153b77] underline" href="/evidence">Xem minh chứng dự án trong Evidence</Link>}
    {attempt.feedback && <p className="whitespace-pre-wrap text-sm">{attempt.feedback}</p>}
    {attempt.status === "NEEDS_REVIEW" && <form onSubmit={event => void review(event)} className="space-y-3">
      <label className="block text-sm font-semibold">Điểm (0–100)
        <input type="number" min={0} max={100} value={score} onChange={e=>setScore(Number(e.target.value))}
          className="mt-1 min-h-11 w-28 rounded-lg border px-3"/></label>
      <label className="block text-sm font-semibold">Nhận xét cho sinh viên
        <textarea required minLength={3} maxLength={4000} value={feedback}
          onChange={e=>setFeedback(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border p-3"/></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} type="submit" className="min-h-11 rounded-xl bg-[#153b77] px-4 text-sm font-bold text-white">
        Gửi điểm và phản hồi
      </button>
    </form>}
  </div>;
}
