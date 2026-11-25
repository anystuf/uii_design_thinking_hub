"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, CircleHelp,
  Compass, FileText, Focus, Lightbulb, MousePointer2, PenLine, Play, RotateCcw,
  Sparkles, Timer, UploadCloud, WandSparkles,
} from "lucide-react";
import { DemoPhoto } from "@/components/demo-photo";
import { DEMO_COURSES, DEMO_EXERCISES, DEMO_TOOLS, type DemoExercise } from "@/lib/demo-content";
import { DemoToolCanvas } from "@/components/demo-tool-canvas";
import { StudioGuidedDemo } from "@/components/studio-guided-demo";

const kindNames = {QUIZ:"Quiz",WRITTEN:"Viết phản tư",PROJECT:"Nhiệm vụ dự án",ACTIVITY:"Hoạt động sáng tạo"} as const;
const markers = ["Learn","Practice","Apply"] as const;

function ExerciseActivity({ exercise, onComplete }: { exercise: DemoExercise; onComplete: () => void }) {
  const [answer,setAnswer] = useState<number|null>(null);
  const [thought,setThought] = useState("");
  const [showHint,setShowHint] = useState(false);
  const [activityNotes,setActivityNotes] = useState<string[]>([]);
  const isQuiz=exercise.kind==="QUIZ";
  const correct=isQuiz && answer!==null && answer===exercise.correctIndex;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-[#e6f1eb] px-3 py-1.5 text-[11px] font-black text-[#235d4d]">{kindNames[exercise.kind]}</span>
      <span className="rounded-full bg-[#ffead9] px-3 py-1.5 text-[11px] font-bold text-[#9d492f]">DEMO — KHÔNG NỘP DỮ LIỆU</span>
    </div>
    <h3 className="text-[clamp(1.35rem,2.5vw,2rem)] font-black leading-snug">{exercise.title}</h3>
    <p className="text-[15px] leading-7 text-[#49606b]">{exercise.prompt}</p>
    {isQuiz && exercise.options && <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-extrabold">Chọn phương án phù hợp nhất</legend>
      {exercise.options.map((option,i)=><label key={option} className={"flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold leading-6 transition "+(answer===i?(correct?"border-[#298363] bg-[#e6f5ed]":"border-[#d49b41] bg-[#fff2dd]"):"border-[#e4e9e4] bg-white hover:border-[#c3d9ce]")}>
        <input type="radio" name={exercise.id} checked={answer===i} onChange={()=>setAnswer(i)} className={"size-4 "+(correct?"accent-[#237a53]":"accent-[#ad7430]")}/>
        <span><strong className={"mr-2 "+(answer===i&&correct?"text-[#237a53]":"text-[#7b5635]")}>{String.fromCharCode(65+i)}.</strong>{option}</span>
      </label>)}
      {answer!==null && <div role="status" className={"rounded-2xl p-4 text-sm leading-6 "+(correct?"bg-[#e6f5df] text-[#225439]":"bg-[#fff0de] text-[#754321]")}>
        <strong className="block">{correct?"Chính xác!":"Thử lại nhé — bạn đang học, không phải thi."}</strong>
        {correct ? exercise.feedback : "Gợi ý: " + (exercise.hint ?? "Đối chiếu phương án với bằng chứng từ người dùng.")}
      </div>}
    </fieldset>}
    {exercise.kind==="WRITTEN" && <div>
      <label htmlFor="demo-reflection" className="text-sm font-extrabold">Phản tư của bạn (chỉ hiển thị trong trang này)</label>
      <textarea id="demo-reflection" value={thought} onChange={e=>setThought(e.target.value)} rows={5} placeholder="Tôi quan sát thấy… Điều tôi chưa chắc chắn là… Tôi muốn tìm hiểu thêm…" className="mt-3 w-full rounded-2xl border-2 border-[#c8d9d4] bg-white p-4 text-sm leading-7 focus:border-[#d65039]"/>
      <p className="mt-2 text-xs text-[#536b70]">Không lưu vào máy chủ hoặc tài khoản. Đừng nhập dữ liệu cá nhân của người được phỏng vấn.</p>
    </div>}
    {exercise.kind==="PROJECT" && <div className="rounded-2xl border-2 border-dashed border-[#c3d7c9] bg-[#f1f8ef] p-5">
      <div className="flex gap-3"><UploadCloud className="shrink-0 text-[#27694f]" size={30}/><div>
        <strong className="text-base">Gợi ý sản phẩm đầu ra</strong>
        <p className="mt-2 text-sm leading-7">{exercise.deliverable}</p>
        <p className="mt-2 text-xs text-[#526b60]">Chế độ demo không tải tệp lên. Vào Learning Hub sau khi đăng nhập để nộp minh chứng thật, nếu khóa học có hoạt động tương ứng.</p>
      </div></div>
      <Link href="/learn" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#22513f] px-4 text-xs font-black text-[#22513f]">Mở Learning Hub <ArrowRight size={15}/></Link>
    </div>}
    {exercise.kind==="ACTIVITY" && <div className="rounded-2xl bg-[#f9e8cc] p-5">
      <strong className="inline-flex items-center gap-2 text-base"><PenLine size={20}/>{exercise.activity?.title ?? "Hoạt động nhóm"}</strong>
      <p className="mt-2 text-sm leading-6 text-[#65533c]">{exercise.activity?.instruction ?? exercise.prompt}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Ô thực hành trực tiếp trong bản demo">
        {(exercise.activity?.labels ?? ["Ghi chú 1", "Ghi chú 2", "Ghi chú 3", "Ghi chú 4"]).map((label,i)=><label key={label} className="flex min-w-0 flex-col gap-2 rounded-xl border border-[#d0b78b] bg-[#fffdf3] p-3 text-xs font-bold text-[#6d573a]">
          <span>{label}</span>
          <textarea aria-label={label} rows={3} maxLength={350} value={activityNotes[i] ?? ""}
            onChange={event=>setActivityNotes(previous=>{const next=[...previous];next[i]=event.target.value;return next;})}
            placeholder="Ghi ý tưởng của bạn…" className="min-h-24 w-full resize-y rounded-lg border border-[#d6c7ab] bg-white p-2 text-sm font-normal leading-5 text-[#173341]"/>
        </label>)}
      </div>
      <p className="mt-4 text-xs leading-6 text-[#64523d]">
        Đầu ra gợi ý: {exercise.activity?.output ?? exercise.deliverable}. Bản nháp chỉ ở màn hình demo; rời bài sẽ mất nội dung, không gửi lên máy chủ.
      </p>
    </div>}
    <details className="rounded-2xl border border-[#dbe5dc] bg-white p-4" open={showHint}>
      <summary onClick={event=>{event.preventDefault();setShowHint(p=>!p)}} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-extrabold text-[#2a5960]">
        <Lightbulb size={18}/> {showHint?"Ẩn gợi ý":"Cần một gợi ý nhỏ?"}
      </summary>
      {showHint&&<p className="mt-2 text-sm leading-7 text-[#45616b]">{exercise.hint ?? "Bắt đầu bằng một bằng chứng nhỏ, rồi nêu điều cần kiểm chứng."}</p>}
    </details>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={onComplete} disabled={isQuiz&&!correct} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#173b4b] px-6 text-sm font-black text-white hover:bg-[#254c5e] disabled:cursor-not-allowed disabled:opacity-40">
        <CheckCircle2 size={18}/> {isQuiz?"Đã hiểu · Đến bài tiếp":"Đánh dấu đã thử · Đến bài tiếp"}
      </button>
      {isQuiz&&<button type="button" onClick={()=>setAnswer(null)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#173b4b] px-5 text-sm font-black"><RotateCcw size={17}/> Làm lại</button>}
    </div>
  </div>;
}

export function DemoPlayground() {
  const query=useSearchParams();
  const requestedCourse=query.get("course")||"foundations";
  const [courseId,setCourseId]=useState(DEMO_COURSES.some(c=>c.id===requestedCourse)?requestedCourse:"foundations");
  const [chapterIndex,setChapterIndex]=useState(0);
  const [completed,setCompleted]=useState<string[]>([]);
  const [focus,setFocus]=useState(false);
  const [openTools,setOpenTools]=useState(!!query.get("tool"));
  const [toolName,setToolName]=useState(query.get("tool")||DEMO_TOOLS[0].name);
  const [toolDone,setToolDone]=useState(false);
  const course=DEMO_COURSES.find(c=>c.id===courseId)??DEMO_COURSES[0];
  const courseExercises=DEMO_EXERCISES.filter(x=>x.courseId===course.id);
  const exercise=courseExercises[chapterIndex]??courseExercises[0];
  const currentTool=DEMO_TOOLS.find(t=>t.name===toolName)??DEMO_TOOLS[0];
  const completedCourse=courseExercises.filter(x=>completed.includes(x.id)).length;
  const progress=Math.round(completedCourse/courseExercises.length*100);
  const selectCourse=(id:string)=>{setCourseId(id);setChapterIndex(0);setOpenTools(false)};
  const selectTool=(name:string)=>{setToolName(name);setToolDone(false)};
  const finish=()=>{
    setCompleted(ids=>ids.includes(exercise.id)?ids:[...ids,exercise.id]);
    if(chapterIndex<courseExercises.length-1)setChapterIndex(chapterIndex+1);
  };

  useEffect(()=>{
    if(focus)document.documentElement.dataset.uiiFocusMode="true";
    else delete document.documentElement.dataset.uiiFocusMode;
    window.dispatchEvent(new Event("uii:focus-mode-changed"));
    return ()=>{
      delete document.documentElement.dataset.uiiFocusMode;
      window.dispatchEvent(new Event("uii:focus-mode-changed"));
    };
  },[focus]);

  return <div className="min-h-screen bg-[#f9f7ef] text-[#173341]">
    <header className="sticky top-0 z-40 border-b border-[#e2e6dc] bg-[#fcfbf5]/95 backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-[1470px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-black"><ArrowLeft size={17}/><span className="rounded-xl bg-[#193c4a] px-3 py-2 font-black text-white">UII</span>Trang chủ</Link>
        <span className="rounded-full bg-[#ffecd5] px-4 py-2 text-[11px] font-black text-[#96472a]">DEMO PUBLIC · KHÔNG LƯU LMS</span>
        <div className="flex gap-2"><Link href="/learn" className="inline-flex min-h-11 items-center rounded-full border border-[#1e4351] px-4 text-xs font-extrabold">Vào khóa học thật <ArrowRight size={15} className="ml-2"/></Link></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1470px] px-5 pb-24 pt-10 sm:px-8">
      {!focus&&<section className="grid items-center gap-6 rounded-[30px] bg-[#d4edbf] p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr]" aria-labelledby="demo-title">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-[#426b46]">LEARN → PRACTICE → APPLY</p>
          <h1 id="demo-title" className="mt-4 text-[clamp(2.5rem,5vw,4.8rem)] font-black leading-[1.02] tracking-[-.05em]">Try, learn,<br/><span className="text-[#cf4b35]">try again.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#3d5c4e]">Không cần đăng nhập. Chọn một khóa học, thử trả lời và nhận phản hồi tức thì. Đây là sandbox minh họa — kết quả không được ghi vào tài khoản.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-extrabold">{DEMO_COURSES.length} khóa học</span>
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-extrabold">{DEMO_EXERCISES.length} bài tập</span>
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-extrabold">4 loại hoạt động</span>
          </div>
        </div>
        <DemoPhoto src={course.photo} alt={"Ảnh workshop minh họa khóa học "+course.title} className="aspect-[5/3] rounded-[25px]" tint={course.accent}/>
      </section>}

      {!focus&&<div className="mt-8"><StudioGuidedDemo/></div>}

      <div className="mt-9 grid min-w-0 gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className={focus?"hidden":"min-w-0 space-y-5"}>
          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">Chọn khóa học demo</h2>
            <div className="mt-4 space-y-2">{DEMO_COURSES.map(c=><button type="button" key={c.id} onClick={()=>selectCourse(c.id)} aria-pressed={course.id===c.id} className={"w-full rounded-xl border p-3 text-left text-sm leading-6 transition "+(course.id===c.id?"border-[#d65b3a] bg-[#fff2e8] font-black":"border-[#e6e9e4] bg-white font-semibold hover:bg-[#f3f7f1]")}>
              {c.title}<span className="mt-1 block text-[11px] font-medium text-[#698087]">{c.chapters.length} bài · {c.level}</span>
            </button>)}</div>
          </section>
          <section className="rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-black">Các bài học</h2>
            <p className="mt-1 text-xs text-[#638085]">Chọn từng bài; thứ tự chỉ là gợi ý.</p>
            <div className="mt-4 space-y-1">{courseExercises.map((item,i)=><button key={item.id} type="button" onClick={()=>setChapterIndex(i)} aria-current={i===chapterIndex?"step":undefined} className={"flex w-full min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm "+(i===chapterIndex?"bg-[#e9f0e6] font-black":"hover:bg-[#f7f9f6]")}>
              <span className={"grid size-8 shrink-0 place-items-center rounded-full text-xs font-black "+(completed.includes(item.id)?"bg-[#d2f0d7] text-[#2e7659]":"bg-[#f5ebde] text-[#775f42]")}>{completed.includes(item.id)?<Check size={16}/>:i+1}</span><span className="min-w-0 flex-1">{course.chapters[i]}</span></button>)}</div>
          </section>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="rounded-[26px] border border-[#e6e9e1] bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#cf5a37]">YOU ARE HERE · BẠN Ở ĐÂY</p><h2 className="mt-2 text-2xl font-black tracking-tight">{course.title}</h2></div>
              <button type="button" onClick={()=>setFocus(x=>!x)} aria-pressed={focus} className={"inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-black "+(focus?"bg-[#203c4a] text-white":"border border-[#b5c6c2] bg-[#f7f9f4]")}><Focus size={17}/>{focus?"Thoát Focus Mode":"Focus Mode"}</button>
            </div>
            <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#e7ebe4]" role="progressbar" aria-label="Tiến độ demo trong khóa học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-[#df6345] transition-[width] duration-200" style={{width:progress+"%"}}/></div>
            <p className="mt-2 text-xs font-semibold text-[#59717a]">Đã thử {completedCourse}/{courseExercises.length} bài · Chỉ tính trong phiên demo hiện tại</p>
            <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Hành trình mẫu">
              {markers.map((stage,i)=><div key={stage} className={"rounded-xl border p-3 text-center text-[11px] font-black "+(i===(exercise.kind==="QUIZ"?1:2)?"border-[#e05c3e] bg-[#fff0e4] text-[#ae422c]":"border-[#e4e8e4] bg-[#f7faf6] text-[#66787b]")}>{String(i+1).padStart(2,"0")} · {stage}</div>)}
            </div>
          </section>

          <section className="rounded-[26px] border border-[#e6e9e1] bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-widest text-[#ae5738]">LESSON {String(chapterIndex+1).padStart(2,"0")} / {courseExercises.length}</span><span className="rounded-full bg-[#e7f1fa] px-3 py-1.5 text-[11px] font-black text-[#315874]">Tự học không áp lực thời gian</span></div>
            <div className="mb-7 rounded-[20px] bg-[#f4f5ef] p-5 sm:p-6">
              <div className="flex items-start gap-3"><BookOpen className="mt-1 shrink-0 text-[#cf603f]" size={22}/><div><h3 className="text-lg font-black">Learn · Điều quan trọng cần nhớ</h3><p className="mt-2 text-sm leading-7 text-[#52686c]">{course.summary} Trong bài “{course.chapters[chapterIndex]}”, hãy xác định một quan sát, một giả định và điều bạn muốn học qua thử nghiệm.</p></div></div>
            </div>
            <ExerciseActivity key={exercise.id} exercise={exercise} onComplete={finish}/>
            {completed.includes(exercise.id)&&<p className="mt-5 rounded-2xl bg-[#e6f4e0] p-3 text-xs font-black text-[#316543]"><CheckCircle2 className="mr-2 inline" size={15}/> Bạn đã thử bài này trong phiên demo. Kết quả không được lưu vào LMS.</p>}
            <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-[#e3e9e2] pt-5">
              <button type="button" onClick={()=>setChapterIndex(i=>Math.max(0,i-1))} disabled={chapterIndex===0} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ccd8d1] px-4 text-xs font-black disabled:opacity-40"><ArrowLeft size={15}/> Bài trước</button>
              <button type="button" onClick={()=>setChapterIndex(i=>Math.min(courseExercises.length-1,i+1))} disabled={chapterIndex===courseExercises.length-1} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ccd8d1] px-4 text-xs font-black disabled:opacity-40">Xem bài tiếp <ArrowRight size={15}/></button>
            </div>
          </section>
        </div>
      </div>

      {!focus&&<section id="tools" className="mt-12 scroll-mt-28 rounded-[28px] bg-[#f9e3d5] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#b95131]">ACTIVITY CARDS / DEMO</p><h2 className="mt-2 text-2xl font-black">10 công cụ thực hành</h2><p className="mt-2 text-sm text-[#63716b]">Chọn một công cụ, đọc nhiệm vụ và thử tạo sản phẩm nhỏ.</p></div><button type="button" onClick={()=>setOpenTools(x=>!x)} className="min-h-11 rounded-full bg-[#1e4050] px-5 text-xs font-black text-white">{openTools?"Thu gọn công cụ":"Mở bộ công cụ"} <ArrowRight size={15} className="ml-2 inline"/></button></div>
        {openTools&&<div className="mt-7 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="space-y-2">{DEMO_TOOLS.map(tool=><button key={tool.name} type="button" onClick={()=>selectTool(tool.name)} aria-pressed={toolName===tool.name} className={"block min-h-11 w-full rounded-xl px-4 py-3 text-left text-sm font-bold "+(toolName===tool.name?"bg-[#1d4755] text-white":"bg-white/70 text-[#295060]")}>{tool.name}</button>)}</div>
          <div className="rounded-[23px] bg-white p-6">
            <span className="rounded-full bg-[#e4f4e4] px-3 py-1.5 text-[11px] font-bold text-[#3c6a50]">{currentTool.mode} · {currentTool.minutes} phút (gợi ý)</span>
            <h3 className="mt-4 text-2xl font-black">{currentTool.name}</h3>
            <p className="mt-3 text-sm leading-7 text-[#556b71]">{currentTool.intro}</p>
            <p className="mt-3 text-sm font-bold">Đầu ra: {currentTool.output}</p>
            <DemoToolCanvas key={currentTool.name} name={currentTool.name}/>
            <button type="button" onClick={()=>setToolDone(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#214a54] px-5 text-xs font-black text-white"><CheckCircle2 size={16}/> Đã thử công cụ</button>
            {toolDone&&<p role="status" className="mt-3 text-sm font-bold text-[#316d4a]">Đã thử trong giao diện demo — dữ liệu không được gửi lên máy chủ.</p>}
          </div>
        </div>}
      </section>}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64787a]"><span>UII Design Thinking Hub · Sandbox minh họa, không thu dữ liệu nghiên cứu của người tham gia.</span><Link href="/" className="inline-flex items-center gap-2 font-black text-[#a24b36]">Quay về trang chủ <ArrowRight size={16}/></Link></div>
    </main>
  </div>;
}
