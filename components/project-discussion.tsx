"use client";

import {useCallback,useEffect,useState,type FormEvent} from "react";
import {CheckCircle2,MessageSquareText,RefreshCcw,Send,ShieldCheck} from "lucide-react";
import {authenticatedApi} from "@/lib/authenticated-api";

type FeedbackEntry={
 id:string;comment:string;createdAt:string;
 author:{id:string;fullName:string;role:"LECTURER"|"STUDENT"|"MENTOR"|"ADMIN"};
};
export function ProjectDiscussion({projectId,token,viewerId}:{projectId:string;token:string;viewerId:string}){
 const [items,setItems]=useState<FeedbackEntry[]>([]);
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [sent,setSent]=useState("");
 const load=useCallback(async()=>{
   if(!projectId||!token)return;
   const feed=await authenticatedApi<FeedbackEntry[]>("/projects/"+encodeURIComponent(projectId)+"/feedback",token);
   setItems(feed);
 },[projectId,token]);
 useEffect(()=>{
   let alive=true;
   setLoading(true);setItems([]);setError("");setSent("");
   if(!projectId||!token)return;
   void authenticatedApi<FeedbackEntry[]>("/projects/"+encodeURIComponent(projectId)+"/feedback",token)
     .then(list=>{if(alive)setItems(list);})
     .catch(e=>{if(alive)setError(e instanceof Error?e.message:"Không tải được trao đổi.");})
     .finally(()=>{if(alive)setLoading(false);});
   return()=>{alive=false;};
 },[projectId,token]);
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();const content=draft.trim();
   if(!content||busy)return;
   setBusy(true);setError("");setSent("");
   try{
     await authenticatedApi("/projects/"+encodeURIComponent(projectId)+"/feedback",token,{
       method:"POST",body:JSON.stringify({comment:content})
     });
     setDraft("");
     await load();
     setSent("Đã gửi trao đổi cho nhóm và giảng viên phụ trách. Mọi người có thể xem khi mở dự án.");
   }catch(e){setError(e instanceof Error?e.message:"Không gửi được trao đổi. Hãy thử lại.");}
   finally{setBusy(false);}
 }
 return <section id="project-discussion" aria-labelledby="project-discussion-heading" className="scroll-mt-5 rounded-[26px] border border-[#d8e3df] bg-white p-4 shadow-sm sm:p-6" data-testid="project-discussion">
   <div className="flex flex-wrap items-start justify-between gap-2">
     <div>
       <p className="text-[11px] font-black uppercase tracking-[.15em] text-[#ac4935]">CLASSROOM EXCHANGE · GIỐNG TRAO ĐỔI TRÊN LMS</p>
       <h3 id="project-discussion-heading" className="mt-2 flex items-center gap-2 text-xl font-black text-[#173445]"><MessageSquareText size={23}/> Trao đổi với nhóm & giảng viên</h3>
       <p className="mt-2 max-w-2xl text-sm leading-7 text-[#54686b]">Đặt câu hỏi, chia sẻ tiến độ và phản hồi theo dự án. Chỉ thành viên nhóm, giảng viên phụ trách và quản trị viên có quyền mới được truy cập; đây không phải bình luận công khai.</p>
     </div>
     <button type="button" onClick={()=>{setError("");void load().catch(e=>setError(e instanceof Error?e.message:"Không tải được trao đổi."));}}
       aria-label="Làm mới trao đổi" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c6dcd6] px-4 text-xs font-bold text-[#173445]">
       <RefreshCcw size={16}/> Làm mới
     </button>
   </div>
   <div className="mt-5 space-y-3 rounded-2xl border border-[#dde9e4] bg-[#f7faf5] p-3 sm:p-4">
     {loading&&<p role="status" className="text-sm text-[#6a7779]">Đang tải lịch sử trao đổi…</p>}
     {!loading&&items.length===0&&!error&&<div className="rounded-xl bg-white p-4 text-sm leading-7 text-[#52696d]">
       Chưa có trao đổi trong dự án này. Bạn có thể bắt đầu bằng câu hỏi: “Nhóm cần thu thập thêm bằng chứng gì trước khi chuyển sang Define?”
     </div>}
     {items.map(m=><article key={m.id} className={"min-w-0 rounded-2xl border p-3 sm:p-4 "+(m.author?.id===viewerId?"ml-auto max-w-[90%] border-[#d1e4da] bg-[#e8f5ec]":"mr-auto max-w-[95%] border-[#e2e9e4] bg-white")}>
       <div className="flex flex-wrap items-center gap-2 text-xs">
         <span className="font-black text-[#183743]">{m.author?.fullName||"Thành viên"}</span>
         <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold "+(m.author?.role==="LECTURER"||m.author?.role==="ADMIN"?"bg-[#e4e1fa] text-[#473a78]":"bg-[#e3f1eb] text-[#27604f]")}>
           {m.author?.role==="LECTURER"?"Giảng viên":m.author?.role==="ADMIN"?"Quản trị":m.author?.role==="MENTOR"?"Cố vấn":"Sinh viên"}
         </span>
         <time className="text-[#677b7d]" dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString("vi-VN")}</time>
       </div>
       <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#213f49]">{m.comment}</p>
     </article>)}
   </div>
   <form className="mt-4 space-y-3" onSubmit={e=>void submit(e)}>
     <label htmlFor="uii-project-message" className="block text-sm font-black text-[#173445]">Gửi câu hỏi hoặc phản hồi</label>
     <textarea id="uii-project-message" required maxLength={3000} minLength={1} rows={3} value={draft}
       onChange={e=>setDraft(e.target.value)} placeholder="Ví dụ: Thầy/cô xem giúp nhóm mình đã xác định đúng nhu cầu người dùng chưa ạ?"
       className="w-full resize-y rounded-2xl border border-[#cddfd5] bg-[#fffefa] p-4 text-base leading-7 focus:outline-[#cb5b42]"/>
     <div className="flex flex-wrap items-center justify-between gap-2">
       <p className="flex items-center gap-2 text-xs text-[#5d7774]"><ShieldCheck size={16}/> Trao đổi nội bộ theo quyền truy cập · không đính kèm tệp nặng</p>
       <button type="submit" disabled={busy||!draft.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-5 text-sm font-black text-white hover:bg-[#315465] disabled:opacity-50"><Send size={17}/>{busy?"Đang gửi…":"Gửi trao đổi"}</button>
     </div>
   </form>
   {sent&&<p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-[#e2f2e4] p-3 text-xs font-semibold text-[#246044]"><CheckCircle2 size={17}/>{sent}</p>}
   {error&&<p role="alert" className="mt-3 rounded-xl border border-[#f6c6bd] bg-[#fff3ef] p-3 text-xs font-semibold text-[#a43d2a]">{error}</p>}
 </section>;
}
