"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Compass, PlayCircle, Users } from "lucide-react";

type LessonSummary = { id: string; title: string };
export type RecommendedStep =
  | { type: "enroll"; title: string; reason: string }
  | { type: "unavailable"; title: string; reason: string }
  | { type: "lesson"; title: string; reason: string; lessonId: string }
  | { type: "apply"; title: string; reason: string };

export function deriveRecommendedStep(
  enrolled: boolean, lessons: LessonSummary[], completedIds: ReadonlySet<string>,
): RecommendedStep {
  if (!enrolled) return {
    type: "enroll", title: "Ghi danh để bắt đầu",
    reason: "Ghi danh một lần để lưu tiến độ và mở các hoạt động dành cho người học.",
  };
  if (lessons.length === 0) return {
    type: "unavailable", title: "Chưa có bài học để bắt đầu",
    reason: "Giảng viên chưa công bố bài học. Bạn có thể khám phá khóa học khác trong lúc chờ.",
  };
  const next = lessons.find(lesson => !completedIds.has(lesson.id));
  if (next) return {
    type: "lesson", title: next.title, lessonId: next.id,
    reason: "Học bài này, luyện tập để tự kiểm tra rồi thử áp dụng vào dự án của nhóm.",
  };
  return {
    type: "apply", title: "Chuyển kiến thức thành sản phẩm",
    reason: "Bạn đã đánh dấu hoàn thành các bài hiện có. Hãy vận dụng cùng nhóm, lưu minh chứng và xin phản hồi.",
  };
}

export function StudentNextAction({
  courseId, enrolled, lessons, completedIds, progressPercent, busy, onEnroll, onOpenLesson,
}: {
  courseId: string;
  enrolled: boolean;
  lessons: LessonSummary[];
  completedIds: ReadonlySet<string>;
  progressPercent: number | null;
  busy: boolean;
  onEnroll: () => void;
  onOpenLesson: (lessonId: string) => void;
}) {
  const step = deriveRecommendedStep(enrolled, lessons, completedIds);
  const completedCount = lessons.filter(lesson => completedIds.has(lesson.id)).length;
  const validProgress = progressPercent !== null && Number.isFinite(progressPercent)
    ? Math.max(0, Math.min(100, progressPercent)) : null;

  return (
    <section aria-labelledby="student-next-action-title" data-testid="student-next-action"
      className="mt-6 rounded-[20px] border border-[#b9dacf] bg-[#eaf5ed] p-4 text-[#173445] sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#376d5b]">
          {step.type === "apply" ? <CheckCircle2 size={22}/> : <Compass size={22}/>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#476c5f]">UII · Bước tiếp theo dành cho bạn</p>
          <h3 id="student-next-action-title" className="mt-1 text-lg font-black leading-snug sm:text-xl">
            {step.type === "lesson" ? "Tiếp tục: " + step.title : step.title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4f6b68]">{step.reason}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {step.type === "enroll" && (
            <button type="button" disabled={busy} onClick={onEnroll}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 text-sm font-bold text-white hover:bg-[#285851] disabled:opacity-50 sm:w-auto">
              <Users size={17}/> Ghi danh khóa học
            </button>
          )}
          {step.type === "lesson" && (
            <button type="button" disabled={busy} onClick={() => onOpenLesson(step.lessonId)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 text-sm font-bold text-white hover:bg-[#285851] disabled:opacity-50 sm:w-auto">
              <PlayCircle size={17}/> Học tiếp bài này <ArrowRight size={16}/>
            </button>
          )}
          {step.type === "apply" && (
            <Link href={"/studio?course=" + encodeURIComponent(courseId)}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 text-sm font-bold text-white hover:bg-[#285851] sm:w-auto">
              <Compass size={17}/> Đến Design Studio <ArrowRight size={16}/>
            </Link>
          )}
          {step.type === "unavailable" && (
            <a href="#course-catalog"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 text-sm font-bold text-white hover:bg-[#285851] sm:w-auto">
              <BookOpen size={17}/> Khám phá khóa học <ArrowRight size={16}/>
            </a>
          )}
        </div>
      </div>
      {enrolled && (lessons.length > 0 || validProgress !== null) && (
        <div className="mt-4 border-t border-[#c7e0d3] pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#426d5e]">
            <span className="font-bold">{lessons.length > 0
              ? "Đã hoàn thành " + completedCount + "/" + lessons.length + " bài đang hiển thị"
              : "Tiến độ tổng quan từ máy chủ"}</span>
            <span>{validProgress === null ? "Tiến độ máy chủ chưa sẵn sàng" : validProgress + "% tiến độ đã lưu"}</span>
          </div>
          {validProgress !== null && (
            <div role="progressbar" aria-label="Tiến độ khóa học" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={validProgress} className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#cbe2d5]">
              <div className="h-full rounded-full bg-[#3c8065]" style={{width: validProgress + "%"}}/>
            </div>
          )}
          {step.type === "lesson" && <p className="mt-2 text-xs leading-5 text-[#58766b]">
            Sau bài học: luyện tập → thực hiện phương pháp trong Studio → lưu minh chứng.
          </p>}
        </div>
      )}
    </section>
  );
}
