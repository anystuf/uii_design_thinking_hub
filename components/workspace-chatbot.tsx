"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, BookOpen, CheckCircle2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AssistantMessageContent } from "@/components/assistant-message-content";
import { deterministicGuide, type HubRole, type GuideReply } from "@/lib/uii-assistant-knowledge";

type LinkItem = {href:string;label:string};
type ChatMessage = {id:number;from:"bot"|"user";text:string;links?:LinkItem[];mode?:string;aiStatus?:string;providerHttpStatus?:number};
type ApiReply = {answer:string;mode:string;links?:LinkItem[];role?:HubRole;verified?:boolean;aiStatus?:string;providerHttpStatus?:number};
type ApiStatus = {assistant:"configured"|"gemini"|"guided";deployment:string;modelConfigured:boolean;connectionVerified?:boolean};

const sampleQuestions: Record<HubRole,string[]> = {
  GUEST:["UII có những tính năng nào?","Đăng ký vai trò giảng viên thế nào?","Trạng thái phát triển hiện tại?","Thử học Design Thinking"],
  STUDENT:["Tiến độ học của tôi đến đâu?","Tôi làm quiz ở đâu?","Nộp minh chứng thế nào?","Bật Focus Mode"],
  LECTURER:["Tạo bài tập quiz thế nào?","Tạo khóa học và công bố","Chấm rubric ở đâu?","Trạng thái nền tảng hiện tại"],
  ADMIN:["Xem danh sách người dùng","Cấp quyền Lecturer thế nào?","Quy trình tạo khóa học","Trạng thái nền tảng hiện tại"],
  MENTOR:["Xem dự án của tôi","Làm sao tham gia đánh giá?","Hướng dẫn Design Studio","Trạng thái nền tảng hiện tại"],
};
const validLinks=new Set(["/","/learn","/demo","/dashboard","/studio","/evidence","/notifications","/review","/admin"]);

export function respondToGuide(message:string,role:HubRole="GUEST",path="/"): {text:string;href?:string;action?:string} {
  const answer=deterministicGuide(message,role,path);
  return {text:answer.text,href:answer.links[0]?.href,action:answer.links[0]?.label};
}

async function authToken():Promise<string|undefined> {
  try {
    const client=getSupabaseBrowserClient();
    const timeout=new Promise<undefined>(resolve=>setTimeout(()=>resolve(undefined),2000));
    const result=await Promise.race([
      client.auth.getSession().then(response=>response.data.session?.access_token),
      timeout,
    ]);
    return result||undefined;
  }catch{return undefined;}
}

export function WorkspaceChatbot() {
  const pathname=usePathname()||"/";
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [role,setRole]=useState<HubRole>("GUEST");
  const [availability,setAvailability]=useState<"loading"|"configured"|"gemini"|"guided"|"degraded">("loading");
  const [messages,setMessages]=useState<ChatMessage[]>([
    {id:0,from:"bot",text:"Chào bạn! Mình là trợ lý học tập UII. Mình có thể giới thiệu các tính năng, chỉ từng bước thực hiện và giúp bạn xem tiến độ học sau khi đăng nhập. Bạn muốn khám phá điều gì trước?"},
  ]);
  const control=useRef<HTMLInputElement>(null);
  const transcript=useRef<HTMLDivElement>(null);
  const currentRequest=useRef<AbortController|null>(null);

  useEffect(()=>{
    if(!open)return;
    control.current?.focus();
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
    document.addEventListener("keydown",onKey);
    return ()=>document.removeEventListener("keydown",onKey);
  },[open]);
  useEffect(()=>{if(open)transcript.current?.scrollTo({top:transcript.current.scrollHeight});},[messages,busy,open]);
  useEffect(()=>{
    if(!open)return;
    let cancelled=false;
    fetch("/api/assistant/chat",{cache:"no-store"}).then(async response=>{
      if(!response.ok)throw new Error("Assistant status unavailable");
      return response.json() as Promise<ApiStatus>;
    }).then(data=>{if(!cancelled)setAvailability(data.modelConfigured?"configured":"guided");})
      .catch(()=>{if(!cancelled)setAvailability("guided");});
    return ()=>{cancelled=true;};
  },[open]);

  useEffect(()=>()=>{currentRequest.current?.abort();},[]);
  async function send(text:string) {
    const question=text.trim().slice(0,700);
    if(!question||busy)return;
    const id=(messages[messages.length-1]?.id||0)+1;
    const user:ChatMessage={id,from:"user",text:question};
    const history=messages.slice(-6).filter(m=>m.id!==0).map(m=>({role:m.from==="user"?"user":"model",text:m.text}));
    setMessages(previous=>[...previous.slice(-19),user]);
    setInput("");
    setBusy(true);
    const controller=new AbortController();
    currentRequest.current=controller;
    try {
      const token=await authToken();
      const response=await fetch("/api/assistant/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},
        body:JSON.stringify({message:question,history,path:pathname}),
        signal:controller.signal,
      });
      if(!response.ok) {
        const data=await response.json().catch(()=>({error:""})) as {error?:string};
        throw new Error(data.error||"Assistant temporarily unavailable");
      }
      const result=await response.json() as ApiReply;
      if(result.role&&sampleQuestions[result.role])setRole(result.role);
      if(result.mode==="gemini")setAvailability("gemini");
      else if(result.mode==="guided")setAvailability(result.aiStatus && result.aiStatus!=="not-configured"?"degraded":"guided");
      const links=(result.links||[]).filter(item=>validLinks.has(item.href)).slice(0,2);
      setMessages(previous=>[...previous.slice(-19),{id:id+1,from:"bot",text:result.answer.slice(0,6000),links,mode:result.mode,aiStatus:result.aiStatus,providerHttpStatus:result.providerHttpStatus}]);
    }catch(error){
      if(controller.signal.aborted)return;
      const fallback:GuideReply=deterministicGuide(question,role,pathname);
      const msg=error instanceof Error&&error.message.includes("nhiều câu hỏi")
        ?"Bạn gửi nhiều câu hỏi liên tiếp. Mình vẫn có thể hướng dẫn cơ bản; bạn hãy thử hỏi AI lại sau một ít phút.\n\n"+fallback.text
        :"Hiện chưa kết nối được dịch vụ trả lời. Mình sẽ dùng hướng dẫn có sẵn, không cần Gemini:\n\n"+fallback.text;
      setMessages(previous=>[...previous.slice(-19),{id:id+1,from:"bot",text:msg,links:fallback.links,mode:"guided"}]);
    }finally {
      setBusy(false);
      currentRequest.current=null;
      control.current?.focus();
    }
  }

  // Recovery is a focused security task, not a place for floating help controls.
  if (pathname === "/forgot-password" || pathname === "/reset-password") return null;

  return <>
    <button type="button"
      aria-label={open?"Đóng Hỏi UII – chatbot hướng dẫn":"Mở Hỏi UII – chatbot hướng dẫn"}
      aria-controls="uii-guide-chat" aria-expanded={open}
      onClick={()=>setOpen(value=>!value)}
      className="fixed bottom-4 right-4 z-[10020] inline-flex min-h-12 items-center gap-2 rounded-full bg-[#173c57] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_32px_rgba(15,47,65,0.25)] transition hover:bg-[#0d2b43] focus-visible:outline-4 focus-visible:outline-orange-500">
      {open?<X size={19} aria-hidden="true"/>:<MessageCircle size={19} aria-hidden="true"/>}
      {open?"Đóng":"Hỏi UII"}
      {!open&&<span className="ml-1 size-2 rounded-full bg-[#a4ebc6]" aria-hidden="true"/>}
    </button>
    {open&&<section id="uii-guide-chat" role="dialog" aria-label="Chatbot hướng dẫn sử dụng UII"
      className="fixed bottom-[80px] right-3 z-[10020] flex max-h-[min(80dvh,720px)] w-[calc(100vw-1.5rem)] max-w-[420px] flex-col overflow-hidden rounded-[25px] border border-[#d6e1df] bg-white shadow-[0_20px_65px_rgba(15,47,65,.26)] sm:right-4">
      <header className="flex shrink-0 items-center gap-3 bg-[#163748] px-4 py-4 text-white">
        <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Bot size={22} aria-hidden="true"/></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black">UII · Trợ lý học tập</h2>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#d7e9ed]">
            {availability==="gemini"?<><Sparkles size={13}/> Gemini AI · hướng dẫn theo ngữ cảnh</>:
              availability==="loading"?"Đang kiểm tra trạng thái trợ lý…":
              availability==="configured"?<><Sparkles size={13}/> Đã cấu hình Gemini · chưa thử kết nối</>:
              availability==="degraded"?<><BookOpen size={13}/> Gemini chưa phản hồi · đang dùng hướng dẫn dự phòng</>:
              <><BookOpen size={13}/> Hướng dẫn từ kho kiến thức UII</>}
          </p>
        </div>
        <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-white/10" aria-label="Đóng cửa sổ chatbot" onClick={()=>setOpen(false)}><X size={18} aria-hidden="true"/></button>
      </header>
      <div ref={transcript} role="log" aria-live="polite" aria-relevant="additions" aria-label="Lịch sử trò chuyện"
        className="min-h-[145px] flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#f5f8f7] p-4">
        {messages.map(message=><div key={message.id}
          className={"max-w-[94%] rounded-2xl p-3 text-sm leading-6 "+(message.from==="user"?"ml-auto bg-[#173c57] text-white":"mr-auto border border-[#dce5e0] bg-white text-[#203c47]")}>
          {message.from==="bot" ? <AssistantMessageContent text={message.text}/> : <p className="whitespace-pre-wrap">{message.text}</p>}
          {message.links&&message.links.length>0&&<div className="mt-3 flex flex-wrap gap-2">
            {message.links.map(link=><Link key={link.href} href={link.href} onClick={()=>setOpen(false)}
              className="inline-flex min-h-10 items-center rounded-full border border-[#9fb9c1] bg-[#f0f6f5] px-3 text-xs font-black text-[#16415b] underline-offset-2 hover:underline">{link.label}</Link>)}
          </div>}
          {message.from==="bot"&&message.mode&&<p className="mt-2 text-[10px] font-semibold text-[#607983]">
            {message.mode==="gemini"?"Gemini AI · kiến thức UII":
             message.mode==="verified-data"?"Tiến độ từ API xác thực":
             message.mode==="verified-status"?"Thông tin trạng thái hệ thống":
             message.aiStatus && message.aiStatus!=="ok" && message.aiStatus!=="not-configured" ?
               "Hướng dẫn dự phòng · Gemini: "+({["invalid-key"]:"khóa bị từ chối",["quota"]:"giới hạn sử dụng",["model-unavailable"]:"model không khả dụng",["timeout"]:"quá thời gian",["empty-response"]:"không có nội dung trả lời",["provider-unavailable"]:"dịch vụ tạm gián đoạn",["request-rejected"]:"request bị từ chối",["invalid-model"]:"cấu hình model không hợp lệ"} as Record<string,string>)[message.aiStatus] + (message.providerHttpStatus?" (HTTP "+message.providerHttpStatus+")":""):
             "Hướng dẫn từ dữ liệu nền tảng"}
          </p>}
        </div>)}
        {busy&&<div role="status" className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-[#dce5e0] bg-white p-3 text-xs font-semibold text-[#55717b]">
          <span className="size-2 animate-pulse rounded-full bg-[#e76a4f]"/> Đang tìm hướng dẫn phù hợp…
        </div>}
      </div>
      <div className="shrink-0 border-t border-[#e1e9e4] bg-white p-3">
        <p className="mb-2 text-xs font-extrabold text-[#486675]">Có thể bắt đầu với</p>
        <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-auto">
          {sampleQuestions[role].map(suggestion=><button key={suggestion} type="button" disabled={busy}
            onClick={()=>void send(suggestion)}
            className="min-h-9 rounded-full border border-[#d9e5e2] bg-[#f2f7f5] px-3 py-1 text-xs font-semibold text-[#22516a] hover:bg-[#e3f0e9] disabled:opacity-40">{suggestion}</button>)}
        </div>
        <form onSubmit={(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();void send(input);}} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="uii-chat-question">Nhập câu hỏi cho chatbot</label>
          <input id="uii-chat-question" ref={control} autoComplete="off" maxLength={700}
            value={input} onChange={event=>setInput(event.target.value)}
            placeholder="Bạn muốn biết hoặc làm gì?" className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#c5d6d1] px-3 text-base text-[#183843] focus:border-[#39778d] focus:outline-offset-2"/>
          <button aria-label="Gửi câu hỏi" type="submit" disabled={busy||!input.trim()}
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#173c57] text-white disabled:cursor-not-allowed disabled:opacity-40"><Send size={19}/></button>
        </form>
        <p className="mt-2 text-[11px] leading-5 text-[#58717a]">
          {availability==="gemini"?"Trợ lý Gemini có thể trả lời tự nhiên; thông tin liên quan tài khoản chỉ lấy khi được xác minh.":
          availability==="configured"?"Đã nhận cấu hình Gemini. Hãy gửi câu hỏi học thuật để kiểm tra kết nối thực tế.":
          availability==="degraded"?"Gemini chưa trả lời thành công. Bản hướng dẫn dự phòng vẫn hoạt động; xem trạng thái dưới câu trả lời.":
          "Bạn vẫn được hướng dẫn ngay cả khi chưa cấu hình Gemini."}
          {" "}Không gửi mật khẩu, API key hay dữ liệu cá nhân nhạy cảm.
        </p>
      </div>
    </section>}
  </>;
}
