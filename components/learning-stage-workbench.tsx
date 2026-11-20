"use client";

import {useState} from "react";
import Link from "next/link";
import {ArrowRight, BookOpenCheck, Check, CircleHelp, Compass, ExternalLink, Lightbulb, Users} from "lucide-react";
import {SAMPLE_TEAMS, STAGE_GUIDES, guideForStage, type ThinkingStage} from "@/lib/stage-experience";

export function SampleTeamGallery({stage,compact=false}:{stage:ThinkingStage;compact?:boolean}) {
  const [active,setActive]=useState(SAMPLE_TEAMS[0].id);
  const selected=SAMPLE_TEAMS.find(x=>x.id===active)??SAMPLE_TEAMS[0];
  const current=guideForStage(stage);
  return <div className="rounded-[25px] border border-[#dce6dd] bg-white p-4 sm:p-5" data-testid="sample-team-gallery">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.14em] text-[#a74730]">CLASSROOM LAB · MINH HỌA</p>
        <h5 className="mt-1 text-lg font-black tracking-tight text-[#163844]">Hai nhóm, hai cách tiếp cận.</h5>
        <p className="mt-1 text-xs leading-5 text-[#506a70]">Tình huống và tên nhóm **mô phỏng**; không phải tài khoản hay bài nộp thật.</p>
      </div>
      <span className="rounded-full border border-[#f0bdad] bg-[#fff0e9] px-3 py-1.5 text-[11px] font-black text-[#8b3d2e]">SAMPLE · KHÔNG LƯU LMS</span>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2" role="group" aria-label="Chọn nhóm minh họa">
      {SAMPLE_TEAMS.map(t=><button type="button" key={t.id} aria-pressed={active===t.id} onClick={()=>setActive(t.id)}
        className={"min-w-0 rounded-2xl border p-3 text-left text-sm transition "+(active===t.id?"border-[#163844] ring-2 ring-[#c8ebe3]":"border-[#e0e8e2] hover:border-[#8bbfb9]")}
        style={{backgroundColor:t.tone}}>
        <p className="font-black text-[#163844]">{t.name}</p>
        <p className="mt-1 text-xs text-[#425c64]">{t.subtitle}</p>
      </button>)}
    </div>
    <div className="mt-3 rounded-2xl border border-[#e2e9e0] bg-[#fafbf7] p-4">
      <p className="text-sm font-black text-[#143744]">{selected.problem}</p>
      {!compact&&<div className="mt-3 flex flex-wrap gap-2">{selected.members.map(m=><span key={m} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4d6268]">{m}</span>)}</div>}
      <div className="mt-4 grid grid-cols-5 gap-1.5" role="list" aria-label="Năm giai đoạn trong ví dụ nhóm">
        {STAGE_GUIDES.map(item=><div key={item.id} role="listitem" title={item.title} className={"min-w-0 rounded-lg px-1 py-2 text-center text-[9px] font-black sm:text-[10px] "+(item.id===stage?"ring-2 ring-[#b85135]":"")} style={{backgroundColor:item.color}}>
          {item.title}
        </div>)}
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-wider text-[#ab4b34]">{current.title} · Đầu ra giai đoạn</p>
      <p className="mt-1 text-sm leading-7 text-[#294652]">{selected.progress[stage]}</p>
      {!compact&&<p className="mt-2 text-xs leading-6 text-[#68787b]">{selected.share}</p>}
    </div>
    <p className="mt-3 text-xs leading-6 text-[#567078]">Để tạo dữ liệu thật: ghi danh → vào Studio → chọn challenge → tạo hoặc nhận lời mời nhóm → lưu hoạt động theo giai đoạn → nộp minh chứng.</p>
  </div>;
}

export function LearningStageWorkbench({stage,courseId,focusMode=false}:{stage:ThinkingStage;courseId:string;focusMode?:boolean}) {
 const guide=guideForStage(stage);
 const [tool,setTool]=useState<string|null>(null);
 const [showTeams,setShowTeams]=useState(false);
 const activeTool=tool&&guide.tools.includes(tool)?tool:null;
 return <section aria-labelledby="stage-workbench-title" data-testid="learning-stage-workbench"
   className="overflow-hidden rounded-[26px] border border-[#d2e1d9] bg-white">
   <div className="p-5 sm:p-6" style={{backgroundColor:guide.surface}}>
    <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.13em] text-[#aa4b31]">
      <Compass size={16}/> YOUR STAGE · LEARN → MAKE → REFLECT</p>
    <h4 id="stage-workbench-title" className="mt-2 text-2xl font-black tracking-[-.04em] text-[#14343f]">
      {guide.title} <span className="text-[#b54f36]">— {guide.tagline}</span>
    </h4>
    <p className="mt-2 text-sm font-bold leading-6 text-[#294b51]">{guide.question}</p>
    <p className="mt-2 text-sm leading-6 text-[#516a6b]">{guide.description}</p>
    <div className="mt-4 rounded-xl border border-white/90 bg-white/75 p-3">
      <p className="flex items-center gap-2 text-xs font-black text-[#264953]"><Check size={15}/> Sản phẩm cần tạo</p>
      <p className="mt-1 text-sm leading-6">{guide.deliverable}</p>
    </div>
   </div>
   <div className="space-y-5 p-4 sm:p-6">
     <div>
       <h5 className="flex items-center gap-2 text-sm font-black text-[#173445]"><CircleHelp size={17}/> Ba câu hỏi định hướng</h5>
       <ol className="mt-3 grid gap-2 sm:grid-cols-3">{guide.prompts.map((question,i)=><li key={question} className="rounded-2xl border border-[#dfebe4] bg-[#fbfaf5] p-3 text-xs leading-6"><span className="mr-2 font-black text-[#b94837]">0{i+1}.</span>{question}</li>)}</ol>
     </div>
     <div>
       <div className="flex flex-wrap items-start justify-between gap-2">
         <div><h5 className="flex items-center gap-2 text-sm font-black text-[#173445]"><Lightbulb size={17}/> Công cụ nên dùng tại giai đoạn này</h5>
           <p className="mt-1 text-xs leading-6 text-[#546b70]">Chọn một công cụ để thử trực tiếp trong bài học; dùng Studio để lưu kết quả nhóm thật.</p></div>
       </div>
       <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={"Công cụ thực hành "+guide.title}>
        {guide.tools.map(name=><button type="button" key={name} aria-pressed={activeTool===name} onClick={()=>setTool(activeTool===name?null:name)}
           className={"min-h-11 rounded-full border px-4 text-xs font-black transition "+(activeTool===name?"border-[#173445] bg-[#173445] text-white":"border-[#bad8d3] bg-[#f0f8f4] text-[#173445] hover:bg-[#d9f2ea]")}>{name}</button>)}
       </div>
       {activeTool&&<div className="mt-4 rounded-2xl border border-[#d6e6de] bg-[#fafbf8] p-3 sm:p-4">
         <p className="text-xs font-black text-[#a44c31]">THỬ CÔNG CỤ · BẢN NHÁP TRONG TRÌNH DUYỆT</p>
         <InlineStageTool key={activeTool} name={activeTool}/>
       </div>}
     </div>
     <div className="flex flex-wrap gap-2">
       <Link href={"/studio?course="+encodeURIComponent(courseId)+"&mode="+stage} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#173445] px-5 text-sm font-black text-white hover:bg-[#31586a]">
         Đem vào dự án thật <ArrowRight size={17}/></Link>
       <button type="button" aria-expanded={showTeams} onClick={()=>setShowTeams(x=>!x)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#adcfc4] bg-white px-4 text-sm font-black text-[#173445]">
         <Users size={17}/>{showTeams?"Ẩn ví dụ hai nhóm":"Xem ví dụ hai nhóm"}</button>
       <Link href="/community" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#adcfc4] bg-white px-4 text-sm font-black text-[#173445]">
         Thảo luận & xem dự án khác <ExternalLink size={15}/></Link>
     </div>
     {showTeams&&!focusMode&&<SampleTeamGallery stage={stage}/>}
   </div>
 </section>;
}
function InlineStageTool({name}:{name:string}){
 // Lazy import requires no new network calls or third-party whiteboard SDK.
 // The tool component is reused from the richer public demo and has a copy button.
 return <StageTool name={name}/>;
}
import {DemoToolCanvas as StageTool} from "@/components/demo-tool-canvas";
