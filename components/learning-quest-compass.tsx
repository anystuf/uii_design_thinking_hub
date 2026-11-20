"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Brain, CheckCircle2, Compass, Flag, HeartHandshake,
  Lightbulb, MapPin, MousePointer2, PauseCircle, PlayCircle, RotateCcw, Shapes, Sparkles,
} from "lucide-react";
import { authenticatedApi as api } from "@/lib/authenticated-api";
import { studioModeHref } from "@/lib/design-thinking-learning-kit";
import { CreativePointerTrail } from "./creative-pointer-trail";

type Mode = "EMPATHIZE" | "DEFINE" | "IDEATE" | "PROTOTYPE" | "TEST";
export type FocusStep = "learn" | "practice" | "apply";
export type LearningRewardSummary = {
  courseId: string;
  xp: number;
  possibleXp: number;
  completedLessons: number;
  totalLessons: number;
  passedExercises: number;
  totalExercises: number;
};

const modes = [
  { id: "EMPATHIZE", name: "Empathize", vi: "Thấu hiểu", hint: "Lắng nghe nhu cầu và quan sát con người", icon: HeartHandshake },
  { id: "DEFINE", name: "Define", vi: "Xác định", hint: "Làm rõ vấn đề thực sự cần giải quyết", icon: Flag },
  { id: "IDEATE", name: "Ideate", vi: "Ý tưởng", hint: "Tạo ra và khám phá nhiều cách giải", icon: Lightbulb },
  { id: "PROTOTYPE", name: "Prototype", vi: "Tạo mẫu", hint: "Biến một ý tưởng thành thứ có thể thử", icon: Shapes },
  { id: "TEST", name: "Test", vi: "Kiểm thử", hint: "Lấy phản hồi và quay lại cải tiến", icon: RotateCcw },
] as const;

const focusSteps: { id: FocusStep; title: string; description: string }[] = [
  { id: "learn", title: "1. Học", description: "Tập trung vào một bài học" },
  { id: "practice", title: "2. Luyện tập", description: "Kiểm tra hiểu biết của bạn" },
  { id: "apply", title: "3. Vận dụng", description: "Thử làm dự án thực tế" },
];

export function LearningQuestCompass({
  courseId, userId, token, lessonCompleted, focusMode, focusStep,
  onFocusModeChange, onFocusStepChange,
}: {
  courseId: string;
  userId: string;
  token: string;
  lessonCompleted: boolean;
  focusMode: boolean;
  focusStep: FocusStep;
  onFocusModeChange: (value: boolean) => void;
  onFocusStepChange: (value: FocusStep) => void;
}) {
  const [mode, setMode] = useState<Mode>("EMPATHIZE");
  const [rewards, setRewards] = useState<LearningRewardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardError, setRewardError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [doodlePointer, setDoodlePointer] = useState(true);
  const storageKey = "uii:learning-compass:v1:" + userId + ":" + courseId;
  const pointerStorageKey = "uii:creative-pointer:v1:" + userId;
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(pointerStorageKey);
      if (saved === "off") setDoodlePointer(false);
      if (saved === "on") setDoodlePointer(true);
    } catch { /* visual preference must never block learning */ }
  }, [pointerStorageKey]);
  const toggleDoodlePointer = () => setDoodlePointer(current => {
    const next = !current;
    try { window.localStorage.setItem(pointerStorageKey, next ? "on" : "off"); } catch { /* optional */ }
    return next;
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved && modes.some(item => item.id === saved))
        setMode(saved as Mode);
    } catch { /* Private browsing should not block learning. */ }
  }, [storageKey]);

  useEffect(() => {
    const listener = () => setRevision(count => count + 1);
    window.addEventListener("uii:learning-progress-changed", listener);
    return () => window.removeEventListener("uii:learning-progress-changed", listener);
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const result = await api<LearningRewardSummary>(
          "/courses/" + encodeURIComponent(courseId) + "/my-rewards", token,
          { signal: controller.signal },
        );
        if (!result || !Number.isFinite(result.xp) || !Number.isFinite(result.possibleXp)) throw new Error("Rewards not ready");
        if (active) { setRewards(result); setRewardError(false); }
      } catch {
        if (active) { setRewards(null); setRewardError(true); }
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [courseId, token, revision]);

  function selectMode(next: Mode) {
    setMode(next);
    try { window.localStorage.setItem(storageKey, next); } catch { /* optional preference */ }
  }
  function toggleFocus() {
    onFocusModeChange(!focusMode);
    onFocusStepChange("learn");
  }
  const current = modes.find(item => item.id === mode) ?? modes[0];
  return (
    <section aria-labelledby="quest-compass-title" className="space-y-5 rounded-[24px] border border-[#d7e5f7] bg-gradient-to-br from-[#f9fbff] via-white to-[#fff7f1] p-4 shadow-sm sm:p-6">
      <CreativePointerTrail enabled={doodlePointer && !focusMode} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-[#9c410f]">
            <Compass size={17} aria-hidden="true"/> DESIGN THINKING · YOUR JOURNEY
          </p>
          <h3 id="quest-compass-title" className="mt-2 text-xl font-extrabold text-[#0b254c] sm:text-2xl">
            La bàn học tập của bạn
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Chọn điều bạn muốn khám phá. Năm chế độ có thể đi qua lại — không phải năm cửa phải vượt theo đúng thứ tự.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={doodlePointer} disabled={focusMode} onClick={toggleDoodlePointer}
            aria-label={doodlePointer ? "Tắt con trỏ nét vẽ" : "Bật con trỏ nét vẽ"}
            title="Nét vẽ đỏ chạy theo chuột trên máy tính. Tự tắt khi Focus Mode hoặc Reduce Motion được bật."
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#f0aca6] bg-[#fff4f2] px-4 text-sm font-bold text-[#9b241d] hover:bg-[#ffe7e2] disabled:cursor-not-allowed disabled:opacity-50">
            <MousePointer2 size={18} aria-hidden="true"/>
            {doodlePointer ? "Con trỏ vẽ · Bật" : "Con trỏ vẽ · Tắt"}
          </button>
        <button type="button" aria-pressed={focusMode} onClick={toggleFocus}
          className={"inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold focus-visible:outline-4 " +
            (focusMode ? "border-[#0e4b84] bg-[#123c75] text-white" : "border-blue-200 bg-white text-[#153b77]")}>
          {focusMode ? <PauseCircle size={18} aria-hidden="true"/> : <Brain size={18} aria-hidden="true"/>}
          {focusMode ? "Thoát chế độ tập trung" : "Chế độ tập trung"}
        </button>
        </div>
      </div>

      {!focusMode && <p className="text-xs leading-5 text-[#8a3027]">Di chuyển chuột để vẽ đường đỏ như một nét phác thảo sáng tạo. Bạn có thể tắt hiệu ứng; trên thiết bị cảm ứng hoặc khi bật giảm chuyển động, nét vẽ tự tắt.</p>}
      <div role="group" aria-label="La bàn năm chế độ tư duy thiết kế" className={focusMode ? "hidden" : "grid grid-cols-2 gap-2 sm:grid-cols-5"}>
        {modes.map((item, index) => {
          const Icon = item.icon;
          const active = mode === item.id;
          return <button key={item.id} type="button" aria-pressed={active}
            aria-label={item.name + " — " + item.vi + (active ? " — Bạn đang ở đây" : "")}
            onClick={() => selectMode(item.id)}
            className={"relative min-h-[110px] rounded-2xl border p-3 text-left transition-colors focus-visible:outline-4 " +
              (active ? "border-[#b94708] bg-[#fff0e3] text-[#733002] ring-2 ring-orange-100" : "border-slate-200 bg-white text-[#143459] hover:border-blue-300 hover:bg-blue-50")}>
            <div className="flex items-center justify-between gap-1">
              <span className={"grid size-9 place-items-center rounded-xl " + (active ? "bg-[#b94708] text-white" : "bg-blue-50 text-blue-800")}>
                <Icon size={19} aria-hidden="true"/>
              </span>
              <span className="text-xs font-bold text-slate-500">{index + 1}/5</span>
            </div>
            <p className="mt-2 text-sm font-extrabold">{item.name}</p>
            <p className="text-xs">{item.vi}</p>
            {active && <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold">
              <MapPin size={13} aria-hidden="true"/> Bạn ở đây
            </span>}
          </button>;
        })}
      </div>

      {focusMode && <p className="text-xs text-slate-600">Đã thu gọn bản đồ và điểm số để bạn tập trung vào một nhiệm vụ.</p>}
      <div role="status" className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-[#f3b5ad] bg-white p-4 shadow-[0_4px_0_#fff0ed]">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0e3] text-[#a6450b]">
          <MapPin size={20} aria-hidden="true"/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#a12d26]">Con trỏ hành trình · Bạn ở đây</p>
          <p className="mt-1 text-sm font-extrabold">{current.name} — {current.vi}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{current.hint}</p>
          <p className="mt-1 text-xs text-slate-500">Đây là điểm chú ý do bạn chọn, không phải cấp độ hay điểm số đánh giá.</p>
        </div>
        <Link href={studioModeHref(mode, courseId)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#153b77] px-3 text-sm font-bold text-[#153b77] hover:bg-blue-50">
          Thực hành <ArrowRight size={16} aria-hidden="true"/>
        </Link>
      </div>

      <section aria-label="Điểm nỗ lực dựa trên dữ liệu học tập" className={focusMode ? "hidden" : "rounded-2xl bg-[#092653] p-4 text-white sm:p-5"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd4ae]">
              <Sparkles size={18} aria-hidden="true"/> Điểm hành trình · XP
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-200">
              20 XP cho mỗi bài học hoàn thành; 40 XP khi đạt một bài luyện tập.
            </p>
          </div>
          <div className="text-right" aria-live="polite">
            {loading ? <span className="text-sm">Đang đồng bộ...</span> :
              rewards ? <p className="text-3xl font-extrabold tabular-nums">{rewards.xp} <span className="text-sm text-slate-200">XP</span></p> :
                <span className="text-sm text-slate-200">Chưa lấy được điểm</span>}
          </div>
        </div>
        {rewards && <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar"
            aria-label="Tiến độ XP khả dụng trong khóa học" aria-valuenow={rewards.xp}
            aria-valuemin={0} aria-valuemax={Math.max(rewards.possibleXp, 1)}>
            <div className="h-full rounded-full bg-[#ffab70]" style={{ width: (rewards.possibleXp ? Math.min(100, rewards.xp / rewards.possibleXp * 100) : 0) + "%" }}/>
          </div>
          <p className="mt-2 text-xs text-slate-200">
            {rewards.completedLessons}/{rewards.totalLessons} bài học · {rewards.passedExercises}/{rewards.totalExercises} bài luyện tập đạt · Không tính điểm trùng khi làm lại.
          </p>
        </>}
        {rewardError && <p className="mt-2 text-xs text-slate-200">Điểm chưa đồng bộ. Bạn vẫn học và làm bài bình thường; thử tải lại sau khi backend sẵn sàng.</p>}
      </section>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div><h4 className="text-base font-extrabold">Nhiệm vụ nhỏ, dễ bắt đầu</h4>
            <p className="mt-1 text-sm text-slate-600">Bạn chọn tốc độ. Không đồng hồ đếm ngược, không chuỗi ngày bắt buộc.</p></div>
          {lessonCompleted && <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-emerald-700">
            <CheckCircle2 size={15} aria-hidden="true"/> Đã học
          </span>}
        </div>
        <div role="group" aria-label="Chọn tác vụ học tập hiện tại" className="grid gap-2 sm:grid-cols-3">
          {focusSteps.map(step => <button key={step.id} type="button" onClick={() => {
              onFocusStepChange(step.id);
              if (!focusMode) onFocusModeChange(true);
            }} aria-pressed={focusMode && focusStep === step.id}
            className={"min-h-20 rounded-xl border px-4 py-3 text-left focus-visible:outline-4 " +
              (focusMode && focusStep === step.id ? "border-[#b94708] bg-orange-50" : "border-slate-200 bg-white hover:border-blue-300")}>
            <p className="text-sm font-extrabold">{step.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
          </button>)}
        </div>
        {focusMode && <p className="rounded-lg bg-blue-50 p-3 text-sm text-[#153b77]" role="status">
          <PlayCircle size={16} aria-hidden="true" className="mr-1 inline"/>
          Chỉ hiện nhiệm vụ bạn đang chọn. Bạn có thể đổi nhiệm vụ hoặc thoát tập trung bất cứ lúc nào.
        </p>}
      </div>
    </section>
  );
}
