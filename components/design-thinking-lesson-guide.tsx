"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Lightbulb, MapPin, RotateCcw } from "lucide-react";
import { findKitLesson, studioModeHref } from "@/lib/design-thinking-learning-kit";

/**
 * A low-distraction, accessible practice scaffold. The self-check is NOT a graded
 * exercise or a source of XP; formal attempts still use LessonPractice APIs.
 */
export function DesignThinkingLessonGuide({ title, courseId }: { title: string; courseId: string }) {
  const kit = findKitLesson(title);
  const [hintIndex, setHintIndex] = useState(-1);
  const [answer, setAnswer] = useState<number | null>(null);
  if (!kit) {
    return <section aria-label="Bắt đầu áp dụng bài học" className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
      <h4 className="font-extrabold">Đưa kiến thức vào thực tế</h4>
      <p className="mt-2 text-sm leading-7">Chọn một vấn đề bạn quan tâm. Ghi lại quan sát, thử một hoạt động với nhóm và lưu minh chứng vào dự án được phân quyền.</p>
      <Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#153b77] underline" href="/studio">
        Mở Design Studio <ArrowRight size={17} aria-hidden="true"/>
      </Link>
    </section>;
  }
  return <section aria-labelledby="guided-apply-heading" className="space-y-4 rounded-2xl border border-[#dce7f6] bg-[#f8fbff] p-4 sm:p-6">
    <div>
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#a44512]"><MapPin size={16} aria-hidden="true"/> {kit.mode} · Áp dụng vào dự án</p>
      <h4 id="guided-apply-heading" className="mt-2 text-lg font-extrabold">Nhiệm vụ thực hành của bạn</h4>
      <p className="mt-2 text-sm leading-7">{kit.mission}</p>
    </div>
    <div className="rounded-xl bg-white p-4">
      <h5 className="text-sm font-bold">Đầu ra cần lưu</h5>
      <p className="mt-1 text-sm leading-6 text-slate-700">{kit.deliverable}</p>
      <p className="mt-2 text-xs text-slate-500">Hãy dùng Studio để lưu bản nháp thực tế. Câu trả lời trên trang này không tự lưu hoặc tính XP.</p>
    </div>
    <details className="rounded-xl border bg-white p-4">
      <summary className="min-h-11 cursor-pointer font-bold">Ba câu hỏi giúp bạn tự đánh giá</summary>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{kit.questions.map(item => <li key={item}>{item}</li>)}</ul>
    </details>
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">Bị mắc kẹt? Hãy xem một gợi ý nhỏ</p>
        <button type="button" onClick={() => setHintIndex(old => (old + 1) % kit.hints.length)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-300 px-3 text-sm font-semibold text-[#153b77]">
          <Lightbulb size={17} aria-hidden="true"/> {hintIndex < 0 ? "Xem gợi ý" : "Gợi ý tiếp theo"}
        </button>
      </div>
      {hintIndex >= 0 && <p role="status" className="mt-3 rounded-lg bg-blue-50 p-3 text-sm leading-6">{kit.hints[hintIndex]}</p>}
    </div>
    <fieldset className="space-y-3 rounded-xl border bg-white p-4">
      <legend className="px-2 text-sm font-extrabold">Tự kiểm tra nhanh · Không tính điểm</legend>
      <p className="text-sm font-semibold leading-6">{kit.quiz.prompt}</p>
      {kit.quiz.options.map((option, i) => <label key={i} className={"flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-6 " + (answer === i ? "border-blue-600 bg-blue-50" : "border-slate-200")}>
        <input type="radio" name={"self-check-" + kit.mode} className="mt-1.5" checked={answer === i} onChange={() => setAnswer(i)}/><span>{option}</span>
      </label>)}
      {answer !== null && <div role="status" className={"rounded-lg p-3 text-sm leading-6 " + (answer === kit.quiz.correctIndex ? "bg-emerald-50 text-emerald-900" : "bg-orange-50 text-orange-950")}>
        {answer === kit.quiz.correctIndex
          ? <span className="inline-flex items-center gap-2 font-bold"><CheckCircle2 size={16}/> Đúng! {kit.quiz.explanation}</span>
          : <span>Chưa chính xác. Đọc lại mục kiến thức rồi thử một lựa chọn khác.</span>}
      </div>}
      {answer !== null && <button type="button" onClick={() => setAnswer(null)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#153b77] underline"><RotateCcw size={16}/> Làm lại</button>}
    </fieldset>
    <Link href={studioModeHref(kit.mode, courseId)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#153b77] px-4 py-3 text-center text-sm font-bold text-white hover:bg-blue-900 sm:w-auto">
      <MapPin size={17} aria-hidden="true"/> Mở đúng chế độ {kit.mode} trong Studio <ArrowRight size={17} aria-hidden="true"/>
    </Link>
  </section>;
}
