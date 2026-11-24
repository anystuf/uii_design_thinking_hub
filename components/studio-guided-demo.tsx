"use client";

import Link from "next/link";
import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { StudioGuidedJourney } from "@/components/studio-guided-journey";
import { getStudioGuidedStep } from "@/lib/studio-guidance";
import { type ThinkingStage } from "@/lib/stage-experience";

type DemoState = "start" | "challenge" | "ready" | "draft" | "done";

/**
 * Public, in-memory walkthrough for teachers reviewing the product.
 * Never calls the LMS API or pretends to create a real team or submission.
 */
export function StudioGuidedDemo() {
  const [state, setState] = useState<DemoState>("start");
  const [mode, setMode] = useState<ThinkingStage>("EMPATHIZE");
  const [draftMode, setDraftMode] = useState<ThinkingStage>("EMPATHIZE");
  const [answer, setAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showTeamForm, setShowTeamForm] = useState(false);

  const challengeId = state === "start" ? null : "sample-challenge";
  const teamId = state === "ready" || state === "draft" || state === "done" ? "sample-team" : null;
  const templates = (["EMPATHIZE","DEFINE","IDEATE","PROTOTYPE","TEST"] as ThinkingStage[])
    .map(id => ({ id: "sample-" + id, mode: id }));
  const activities = state === "draft" || state === "done"
    ? [{ id: "sample-activity", mode: draftMode, status: state === "done" ? "COMPLETED" : "DRAFT", templateId: "sample-" + draftMode }]
    : [];
  const step = getStudioGuidedStep({
    courseId: "sample-course",
    challenges: [{ id: "sample-challenge", status: "PUBLISHED" }],
    challengeId, teamId,
    myTeams: state === "challenge" ? [] : teamId ? [{ id: "sample-team", challengeId: "sample-challenge" }] : [],
    invitationCount: 0, templates, activities, mode,
  });
  const safeStep = step.kind === "evidence"
    ? { ...step, action: "Xem Studio thật", href: "/studio",
        explanation: "Trong UII thật, bước tiếp theo là lưu minh chứng và xin phản hồi. Bản xem thử này không tạo hoặc lưu dự án." }
    : step;

  function next() {
    if (step.kind === "choose-challenge") setState("challenge");
    else if (step.kind === "create-team") setShowTeamForm(true);
    else if (step.kind === "start") {
      setDraftMode(mode); setState("draft"); setShowAnswer(true); setAnswer("");
    } else if (step.kind === "resume") setShowAnswer(true);
  }
  function reset() {
    setState("start");setMode("EMPATHIZE");setAnswer("");setShowAnswer(false);
    setShowTeamForm(false);setTeamName("");
  }

  return (
    <section id="studio-self-guided" data-testid="studio-guided-demo"
      className="scroll-mt-28 rounded-[28px] border border-[#d9e6db] bg-white p-4 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#9f492e]">
            PUBLIC PRODUCT WALKTHROUGH · TỰ HƯỚNG DẪN
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#173445] sm:text-3xl">
            Thử Design Studio như người học lần đầu
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#56716f]">
            Không cần tài khoản. Mỗi lần chỉ có một gợi ý phù hợp; bạn có thể bỏ qua, mở ví dụ
            hoặc thay đổi giai đoạn bất cứ lúc nào.
          </p>
        </div>
        <span className="rounded-full border border-[#e9bdad] bg-[#fff4e8] px-3 py-2 text-[11px] font-black text-[#99513a]">
          DEMO · KHÔNG GHI DỮ LIỆU
        </span>
      </div>
      <div className="mt-5">
        <StudioGuidedJourney step={safeStep} stage={mode} completedCount={state === "done" ? 1 : 0}
          busy={false} onAction={next} onSelectStage={setMode}/>
      </div>
      {showTeamForm && state === "challenge" && (
        <form className="mt-4 max-w-xl space-y-3 rounded-2xl border border-[#e0e9df] bg-[#f8faf7] p-4"
          onSubmit={event => {event.preventDefault();if(teamName.trim()){setState("ready");setShowTeamForm(false);}}}>
          <label className="block text-sm font-bold text-[#264d4d]" htmlFor="sample-team-name">Tên nhóm minh họa</label>
          <input id="sample-team-name" required maxLength={80} value={teamName} onChange={event => setTeamName(event.target.value)}
            placeholder="Ví dụ: Nhóm Mây Xanh" className="min-h-12 w-full rounded-xl border border-[#bdd5c4] bg-white px-3 text-base"/>
          <button type="submit" className="min-h-11 rounded-xl bg-[#173f42] px-5 text-sm font-bold text-white">
            Tạo nhóm mô phỏng
          </button>
        </form>
      )}
      {state === "draft" && showAnswer && mode === draftMode && (
        <div className="mt-4 max-w-2xl rounded-2xl border border-[#d8e5db] bg-[#f9faf6] p-4">
          <label htmlFor="studio-demo-reflection" className="block text-sm font-bold text-[#214b4d]">
            Một quan sát hoặc câu hỏi bạn muốn kiểm chứng
          </label>
          <p className="mt-1 text-xs leading-6 text-[#647a72]">Ví dụ: Lần gần nhất bạn không tìm được góc học yên tĩnh là khi nào?</p>
          <textarea id="studio-demo-reflection" rows={3} maxLength={700} value={answer} onChange={event=>setAnswer(event.target.value)}
            placeholder="Viết một ý tưởng ngắn…" className="mt-3 w-full rounded-xl border border-[#c9dcd1] p-3 text-base"/>
          <button type="button" disabled={!answer.trim()} onClick={()=>setState("done")}
            className="mt-3 min-h-11 rounded-xl bg-[#173f42] px-5 text-sm font-bold text-white disabled:opacity-40">
            Hoàn thành hoạt động minh họa
          </button>
        </div>
      )}
      {state === "done" && (
        <p role="status" className="mt-4 rounded-xl border border-[#b8dbc5] bg-[#f1faf0] p-4 text-sm font-semibold text-[#31634e]">
          Bạn vừa thử một vòng: chọn vấn đề → tạo nhóm → làm hoạt động → nhận phản hồi. Dữ liệu chỉ tồn tại trong trang này, không được gửi lên LMS.
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#e4ebe5] pt-4">
        <button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cbd8ce] bg-white px-4 text-xs font-bold text-[#3d6660]">
          <RotateCcw size={15}/> Thử lại từ đầu
        </button>
        <Link href="/studio" className="inline-flex min-h-11 items-center rounded-xl px-2 text-xs font-bold text-[#345d5f] underline-offset-2 hover:underline">
          Vào Studio thật (cần đăng nhập)
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#77877d]">
          <ShieldCheck size={15}/> Không thu thập dữ liệu trong demo này
        </span>
      </div>
    </section>
  );
}
