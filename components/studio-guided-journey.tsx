"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Compass, Lightbulb, Sparkles } from "lucide-react";
import { guideForStage, STAGE_GUIDES, type ThinkingStage } from "@/lib/stage-experience";
import type { StudioGuidedStep } from "@/lib/studio-guidance";

export function StudioGuidedJourney({
  step, stage, completedCount, busy, onAction, onSelectStage,
}: {
  step: StudioGuidedStep;
  stage: ThinkingStage;
  completedCount: number;
  busy: boolean;
  onAction: () => void;
  onSelectStage: (stage: ThinkingStage) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const guide = guideForStage(stage);

  return (
    <section aria-label="Hướng dẫn nhẹ trong Design Studio" data-testid="studio-guided-journey"
      className="rounded-[24px] border border-[#c5ded0] bg-[#eef7f0] p-4 text-[#163c3f] shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#336e62]">
          {step.kind === "evidence" ? <CheckCircle2 size={22}/> : <Compass size={22}/>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[.13em] text-[#4d7564]">UII · Khám phá theo nhịp của bạn</p>
          <h2 className="mt-1 text-lg font-black leading-snug sm:text-xl">{step.title}</h2>
          {!expanded && <p className="mt-1 text-xs text-[#5b7870]">Gợi ý của bạn luôn có sẵn khi cần.</p>}
        </div>
        <button type="button" onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl border border-[#c8ddd2] bg-white px-3 text-xs font-bold text-[#285c52]"
          aria-label={expanded ? "Thu gọn hướng dẫn" : "Mở gợi ý"}>
          {expanded ? "Thu gọn" : "Mở gợi ý"}
          <ChevronDown aria-hidden="true" size={15} className={expanded ? "rotate-180" : ""}/>
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <p className="max-w-3xl text-sm leading-6 text-[#486b63]">{step.explanation}</p>
          <div className="flex flex-wrap items-center gap-3">
            {step.href ? (
              <Link href={step.href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173f42] px-5 py-2.5 text-sm font-black text-white hover:bg-[#285c58]">
                {step.action}<ArrowRight size={16} aria-hidden="true"/>
              </Link>
            ) : (
              <button type="button" onClick={onAction} disabled={busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173f42] px-5 py-2.5 text-sm font-black text-white hover:bg-[#285c58] disabled:cursor-not-allowed disabled:opacity-50">
                {step.action}<ArrowRight size={16} aria-hidden="true"/>
              </button>
            )}
            <span className="text-xs text-[#668077]">Không áp lực · Không cần theo thứ tự cố định</span>
          </div>

          <details className="group rounded-xl border border-[#d5e6db] bg-white/75 p-3" data-testid="studio-extra-guidance">
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-xs font-bold text-[#315d57]">
              <Lightbulb size={16} aria-hidden="true"/>
              Muốn tìm hiểu thêm? Xem ví dụ và các cách tiếp cận
              <ChevronDown size={14} aria-hidden="true" className="ml-auto group-open:rotate-180"/>
            </summary>
            <p className="mt-2 text-xs leading-6 text-[#526f66]">
              Góc nhìn đang chọn: <strong>{guide.title} — {guide.vi}</strong>. {guide.question}
            </p>
            <p className="mt-1 text-xs leading-6 text-[#526f66]">Sản phẩm có thể tạo: {guide.deliverable}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STAGE_GUIDES.map(item => (
                <button type="button" key={item.id} disabled={busy} onClick={() => onSelectStage(item.id)}
                  aria-pressed={item.id === stage}
                  className={"min-h-10 rounded-full border px-3 text-xs font-bold focus-visible:outline-2 " +
                    (item.id === stage ? "border-[#427b69] bg-[#d7eddf]" : "border-[#d1ded5] bg-white hover:bg-[#ecf4ee]")}>
                  {item.title}
                </button>
              ))}
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6a8177]">
            {completedCount > 0 && <><Sparkles size={14} aria-hidden="true"/><span>
              {completedCount} hoạt động thật đã hoàn thành trong nhóm
            </span></>}
            {completedCount === 0 && <span>Hãy bắt đầu bằng một bước nhỏ; thành tựu chỉ tính khi hoạt động được lưu thật.</span>}
          </div>
        </div>
      )}
    </section>
  );
}
