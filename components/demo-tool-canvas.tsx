"use client";
import { useState } from "react";
import { ArrowUpRight, ClipboardCopy, Plus, StickyNote, Trash2 } from "lucide-react";

type ToolLayout = {caption:string;fields:readonly string[];link:string;note:string;sticky?:boolean};
const MIRO="https://miro.com/templates/";
const layouts:Record<string,ToolLayout>={
  "Interview Guide":{caption:"Interview preparation",fields:["Research goal","Open question 1","Open question 2","Open question 3","Follow-up question"],link:MIRO+"user-interview/",note:"Ask about lived experiences without leading the participant."},
  "Observation Log":{caption:"Observation log",fields:["Context","What you see / hear","Verbatim quote","Assumption to verify"],link:MIRO+"user-research/",note:"Separate observation from inference."},
  "Empathy Map":{caption:"Empathy map · Sticky notes",fields:["SAYS · What users say","THINKS · What users think","DOES · What users do","FEELS · What users feel","PAINS · Pain points","GAINS · Desired outcomes / goals"],link:MIRO+"empathy-map/",note:"Place notes in the right category. Add only insights grounded in observation or interviews.",sticky:true},
  "POV Builder":{caption:"Point-of-View",fields:["Specific user","Real need (not a solution)","Surprising evidenced insight"],link:MIRO+"point-of-view-statements/",note:"POV = User + Need + Insight."},
  "HMW Reframing":{caption:"How Might We",fields:["How might we… question 1","How might we… question 2","How might we… question 3"],link:MIRO+"research-and-design/",note:"Ask questions broad enough to generate ideas and focused enough to act."},
  "Crazy 8s":{caption:"Eight idea sketches",fields:["Idea 01","Idea 02","Idea 03","Idea 04","Idea 05","Idea 06","Idea 07","Idea 08"],link:MIRO+"crazy-eights/",note:"Quickly sketch eight different approaches. Miro offers drawing tools for visual sketches.",sticky:true},
  "Idea Selection":{caption:"Select ideas",fields:["High impact · high feasibility","High impact · low feasibility","Low impact · high feasibility","Low impact · low feasibility"],link:MIRO+"prioritization/",note:"Sort ideas before choosing what to test.",sticky:true},
  "Storyboard":{caption:"Storyboard · Four frames",fields:["01 · Context / before the journey","02 · Situation and problem","03 · Interaction with prototype","04 · Outcome and feelings"],link:MIRO+"storyboard/",note:"Each frame shows a scene. Add sticky notes here or open Miro for drawings and images.",sticky:true},
  "Prototype Checklist":{caption:"Prototype checklist",fields:["Assumption to verify","One core user task","Prototype fidelity","How to test with users","Signs of success"],link:MIRO+"research-and-design/",note:"Keep the prototype small enough to learn quickly; a finished product is unnecessary."},
  "Feedback Canvas":{caption:"Feedback capture grid",fields:["What worked","What users found confusing","New questions","Next iteration"],link:MIRO+"canvas/",note:"Capture concrete evidence before deciding what to improve.",sticky:true},
};

const colors=["#ffe4b8","#d6ecf3","#f6d4e4","#e5e4fd","#daf0cb","#fff2ba","#fad6c3","#e4e8fd"];

export function DemoToolCanvas({name}:{name:string}) {
  const layout=layouts[name]??layouts["Interview Guide"];
  const [cards,setCards]=useState<Record<string,string[]>>({});
  const [message,setMessage]=useState("");
  const update=(field:string,index:number,value:string)=>{
    setCards(previous=>({...previous,[field]:layoutFields(previous,field).map((item,i)=>i===index?value:item)}));
    setMessage("");
  };
  const add=(field:string)=>{setCards(previous=>({...previous,[field]:[...layoutFields(previous,field),""]}));};
  const remove=(field:string,index:number)=>{
    setCards(previous=>({...previous,[field]:layoutFields(previous,field).filter((_,i)=>i!==index)}));
  };
  const copy=async()=>{
    const result=[name,...layout.fields.map(label=>label+"\n"+layoutFields(cards,label).filter(Boolean).map(x=>"- "+x).join("\n"))].join("\n\n");
    try {await navigator.clipboard.writeText(result);setMessage("Draft copied; paste it into Google Docs or a submission.");}
    catch {setMessage("Clipboard access is unavailable. Select and copy individual notes instead.");}
  };
  return <div className="mt-5 space-y-4" data-testid="demo-structured-tool">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[11px] font-black uppercase tracking-[.12em] text-[#ae442c]">WORKSHOP CANVAS</p>
        <h4 className="mt-1 text-lg font-black text-[#173445]">{layout.caption}</h4></div>
      <a href={layout.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#173445] bg-white px-4 text-xs font-black text-[#173445] hover:bg-[#e5f3f0]">
        Open official Miro template <ArrowUpRight size={15}/></a>
    </div>
    <p className="text-xs leading-6 text-[#536d71]">{layout.note} Miro is an external service and may require an account. No third-party SDK is loaded and nothing is shared with Miro automatically.</p>
    <div className={"grid gap-3 "+(layout.sticky?"sm:grid-cols-2":"sm:grid-cols-2 xl:grid-cols-3")}>
      {layout.fields.map((field,index)=><section key={field} className="min-w-0 rounded-2xl border border-[#dae5da] p-3" style={{backgroundColor:colors[index%colors.length]}}>
        <h5 className="flex items-center gap-2 text-sm font-black text-[#243943]"><StickyNote size={16} aria-hidden="true"/>{field}</h5>
        <div className="mt-3 space-y-2">
          {layoutFields(cards,field).map((value,i)=><div key={i} className="group relative rounded-xl bg-white/90 p-2 shadow-sm">
            <label className="sr-only" htmlFor={"note-"+index+"-"+i}>{field} · note {i+1}</label>
            <textarea id={"note-"+index+"-"+i} value={value} rows={layout.sticky?2:3} maxLength={550}
              placeholder={layout.sticky?"Write one observation…":"Enter your notes here…"}
              className="w-full resize-y rounded-lg border border-transparent bg-transparent p-2 pr-6 text-sm leading-6 text-[#183542] focus:border-[#7fabb4]"
              onChange={e=>update(field,i,e.target.value)}/>
            {layout.sticky&&layoutFields(cards,field).length>1&&<button type="button" onClick={()=>remove(field,i)}
              aria-label={"Delete note "+(i+1)+" in "+field} className="absolute right-1 top-1 grid size-8 place-items-center rounded-lg text-[#6b6c62] hover:bg-[#fce1dc]"><Trash2 size={15}/></button>}
          </div>)}
        </div>
        {layout.sticky&&<button type="button" onClick={()=>add(field)}
          className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-full border border-[#627981] px-3 text-xs font-bold text-[#234858] hover:bg-white/70"><Plus size={14}/> Add sticky note</button>}
      </section>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e8e1] pt-4">
      <p className="max-w-md text-xs leading-5 text-[#647678]">Draft notes exist only in this tab. Use Copy or Miro/Drive to keep them, then submit a link in Evidence.</p>
      <button type="button" onClick={()=>void copy()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-5 text-xs font-black text-white"><ClipboardCopy size={16}/> Copy draft</button>
    </div>
    {message&&<p role="status" className="rounded-xl bg-[#dcefe2] p-3 text-xs font-semibold text-[#285847]">{message}</p>}
  </div>;
}
function layoutFields(cards:Record<string,string[]>,field:string):string[]{return cards[field]??[""];}
