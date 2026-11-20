"use client";

import {useCallback,useEffect,useMemo,useState,type FormEvent} from "react";
import Link from "next/link";
import {
  ArrowRight, BookmarkCheck, Check, ChevronDown, ChevronUp, CircleHelp,
  Lightbulb, MessageCircle, Plus, Search, Send, ShieldCheck, Sparkles, ThumbsUp, Trash2, Users,
} from "lucide-react";
import {authenticatedApi} from "@/lib/authenticated-api";

type Viewer={id:string;fullName:string;role:"STUDENT"|"LECTURER"|"MENTOR"|"ADMIN"};
type Person={id:string;fullName:string;role:string};
type Reaction={userId:string;type:string};
type Question={
  id:string;title:string;caption:string;topic:string;publishedAt:string;
  acceptedCommentId:string|null;author:Person;reactions:Reaction[];
  _count:{comments:number;reactions:number};
};
type Answer={id:string;content:string;createdAt:string;author:Person;replies?:Answer[]};

const topics=[
  {value:"ALL",label:"Tất cả"},{value:"GENERAL",label:"Hỏi chung"},
  {value:"EMPATHIZE",label:"Empathize"},{value:"DEFINE",label:"Define"},
  {value:"IDEATE",label:"Ideate"},{value:"PROTOTYPE",label:"Prototype"},{value:"TEST",label:"Test"},
] as const;
const prompts=[
  "Làm sao viết câu hỏi phỏng vấn không dẫn dắt người dùng?",
  "Phân biệt insight và giả định của nhóm thế nào?",
  "Khi nào một prototype đủ tốt để bắt đầu kiểm thử?",
];
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#173445] px-5 text-sm font-bold text-white transition hover:bg-[#285a5c] disabled:cursor-not-allowed disabled:opacity-50";
const subtle="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d2dfd9] bg-white px-3.5 text-xs font-bold text-[#254650] transition hover:border-[#8da9a0] disabled:opacity-50";
const topicLabel=(value:string)=>topics.find(t=>t.value===value)?.label??"Cộng đồng";
const readableDate=(value:string)=>new Date(value).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"});

export function CommunityQaBoard({token,viewer}:{token:string;viewer:Viewer}){
  const [questions,setQuestions]=useState<Question[]>([]);
  const [loading,setLoading]=useState(true);
  const [apiReady,setApiReady]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [search,setSearch]=useState("");
  const [topic,setTopic]=useState("ALL");
  const [sort,setSort]=useState<"latest"|"popular"|"unanswered">("latest");
  const [composing,setComposing]=useState(false);
  const [title,setTitle]=useState("");
  const [body,setBody]=useState("");
  const [newTopic,setNewTopic]=useState("GENERAL");
  const [selectedId,setSelectedId]=useState("");
  const [answers,setAnswers]=useState<Answer[]>([]);
  const [answerDraft,setAnswerDraft]=useState("");
  const [answersLoading,setAnswersLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState("");

  const refresh=useCallback(async()=>{
    const result=await authenticatedApi<Question[]>("/community/questions",token);
    setQuestions(result);setApiReady(true);
  },[token]);

  useEffect(()=>{
    let active=true;
    setLoading(true);setError("");
    void authenticatedApi<Question[]>("/community/questions",token)
      .then(items=>{if(active){setQuestions(items);setApiReady(true);}})
      .catch(err=>{if(active){setApiReady(false);setError(err instanceof Error?err.message:"Không tải được mục Hỏi đáp.");}})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[token]);

  const visible=useMemo(()=>{
    const needle=search.trim().toLocaleLowerCase("vi");
    const filtered=questions.filter(q=>(topic==="ALL"||q.topic===topic)&&
      (!needle||(q.title+" "+q.caption+" "+q.author.fullName).toLocaleLowerCase("vi").includes(needle))&&
      (sort!=="unanswered"||q._count.comments===0));
    return filtered.sort((a,b)=>sort==="popular"
      ? (b._count.reactions+b._count.comments*2)-(a._count.reactions+a._count.comments*2)
      : Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  },[questions,topic,search,sort]);
  const selected=questions.find(q=>q.id===selectedId);
  const isMyVote=(q:Question)=>q.reactions.some(v=>v.userId===viewer.id&&v.type==="INSIGHTFUL");

  async function loadAnswers(questionId:string){
    setAnswersLoading(true);
    try{setAnswers(await authenticatedApi<Answer[]>("/community/questions/"+questionId+"/answers",token));}
    finally{setAnswersLoading(false);}
  }
  async function openQuestion(id:string){
    if(selectedId===id){setSelectedId("");setAnswerDraft("");return;}
    setSelectedId(id);setAnswerDraft("");setError("");setAnswers([]);
    try{await loadAnswers(id);}
    catch(err){setError(err instanceof Error?err.message:"Không tải được câu trả lời.");}
  }
  async function publishQuestion(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy||title.trim().length<12||body.trim().length<20)return;
    setBusy(true);setError("");setNotice("");
    try{
      const saved=await authenticatedApi<{id:string}>("/community/questions",token,{
        method:"POST",body:JSON.stringify({title:title.trim(),body:body.trim(),topic:newTopic}),
      });
      await refresh();setComposing(false);setTitle("");setBody("");setTopic("ALL");setSort("latest");
      setNotice("Câu hỏi đã được đăng. Thành viên đăng nhập có thể đọc và trả lời.");
      await openQuestion(saved.id);
    }catch(err){setError(err instanceof Error?err.message:"Không đăng được câu hỏi.");}
    finally{setBusy(false);}
  }
  async function publishAnswer(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected||answerDraft.trim().length<5||busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      await authenticatedApi("/community/questions/"+selected.id+"/answers",token,{
        method:"POST",body:JSON.stringify({content:answerDraft.trim()}),
      });
      setAnswerDraft("");await Promise.all([loadAnswers(selected.id),refresh()]);
      setNotice("Đã đăng câu trả lời.");
    }catch(err){setError(err instanceof Error?err.message:"Không gửi được câu trả lời.");}
    finally{setBusy(false);}
  }
  async function toggleVote(q:Question){
    if(busy)return;setBusy(true);setError("");
    const mine=isMyVote(q);
    try{
      await authenticatedApi("/community/posts/"+q.id+"/reactions"+(mine?"/INSIGHTFUL":""),token,{
        method:mine?"DELETE":"POST",...(mine?{}:{body:JSON.stringify({type:"INSIGHTFUL"})}),
      });
      await refresh();
    }catch(err){setError(err instanceof Error?err.message:"Không cập nhật được bình chọn.");}
    finally{setBusy(false);}
  }
  async function accept(answerId:string){
    if(!selected||busy)return;setBusy(true);setError("");
    try{
      await authenticatedApi("/community/questions/"+selected.id+"/answers/"+answerId+"/accept",token,{method:"PATCH"});
      await refresh();setNotice("Đã cập nhật câu trả lời được chọn.");
    }catch(err){setError(err instanceof Error?err.message:"Không cập nhật được câu trả lời.");}
    finally{setBusy(false);}
  }
  async function deleteQuestion(id:string){
    if(busy)return;setBusy(true);setError("");
    try{
      await authenticatedApi("/community/questions/"+id,token,{method:"DELETE"});
      setSelectedId("");setConfirmDelete("");await refresh();
      setNotice("Đã xóa câu hỏi của bạn.");
    }catch(err){setError(err instanceof Error?err.message:"Không xóa được câu hỏi.");}
    finally{setBusy(false);}
  }

  return <section id="community-questions" aria-labelledby="community-qa-heading" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#a24b34]">UII DISCUSS · ASK → ANSWER → IMPROVE</p>
        <h2 id="community-qa-heading" className="mt-1 text-2xl font-black tracking-tight text-[#173445] sm:text-3xl">Hỏi đáp cùng cộng đồng</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526b70]">Đặt vấn đề thật, chia sẻ kinh nghiệm và kết nối câu trả lời với từng giai đoạn Design Thinking.</p>
      </div>
      <button type="button" disabled={busy||loading||!apiReady} onClick={()=>setComposing(v=>!v)} aria-expanded={composing}
        className={primary}><Plus size={18}/>{composing?"Đóng biểu mẫu":"Đặt câu hỏi"}</button>
    </div>
    {notice&&<p role="status" className="rounded-xl border border-[#c3e0ca] bg-[#ebf8ee] px-4 py-3 text-sm text-[#215b3b]"><Check size={16} className="mr-2 inline"/>{notice}</p>}
    {error&&<div role="alert" className="rounded-xl border border-[#f0c3b6] bg-[#fff2eb] p-4 text-sm leading-6 text-[#8b4138]">
      <p>{error}</p>
      <p className="mt-1 text-xs">Nếu backend chưa được cập nhật, Hỏi đáp có thể tạm thời chưa khả dụng. Khu chia sẻ dự án bên dưới vẫn hoạt động riêng.</p>
      <button type="button" disabled={loading||busy} className="mt-2 text-xs font-bold underline" onClick={()=>{setError("");setLoading(true);void refresh().catch(err=>{setApiReady(false);setError(err instanceof Error?err.message:"Không tải được câu hỏi.");}).finally(()=>setLoading(false));}}>Thử tải lại</button>
    </div>}
    {composing&&<form onSubmit={e=>void publishQuestion(e)} className="space-y-4 rounded-[24px] border border-[#bedad0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-[#173445]"><CircleHelp size={19}/><h3 className="text-lg font-black">Bạn muốn hỏi điều gì?</h3></div>
      <label className="block text-sm font-bold text-[#284752]">Tiêu đề câu hỏi
        <input required minLength={12} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}
          placeholder="Ví dụ: Làm sao tránh câu hỏi dẫn dắt khi phỏng vấn?" className="mt-2 min-h-12 w-full rounded-xl border border-[#ccdcd6] p-3 text-base"/>
      </label>
      <label className="block text-sm font-bold text-[#284752]">Chủ đề
        <select value={newTopic} onChange={e=>setNewTopic(e.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-[#ccdcd6] bg-white p-3 text-base">
          {topics.filter(item=>item.value!=="ALL").map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-bold text-[#284752]">Bối cảnh và điều bạn đã thử
        <textarea required minLength={20} maxLength={3000} rows={5} value={body} onChange={e=>setBody(e.target.value)}
          placeholder="Mô tả tình huống, thông tin bạn đã quan sát và câu trả lời bạn đang tìm kiếm…"
          className="mt-2 w-full resize-y rounded-xl border border-[#ccdcd6] p-3 text-base leading-7"/>
      </label>
      <p className="text-xs leading-6 text-[#536b70]"><ShieldCheck size={15} className="mr-1 inline"/>Không chia sẻ tên thật, số điện thoại hoặc dữ liệu phỏng vấn khi chưa có sự đồng ý. Bài viết chỉ hiển thị cho thành viên đăng nhập.</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy||title.trim().length<12||body.trim().length<20} className={primary}><Send size={17}/>{busy?"Đang gửi…":"Đăng câu hỏi"}</button>
        <button type="button" disabled={busy} className={subtle} onClick={()=>setComposing(false)}>Hủy</button>
      </div>
    </form>}
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div className="min-w-0 space-y-4">
        <div className="rounded-[22px] border border-[#d9e5df] bg-white p-3 sm:p-4">
          <label className="relative block" htmlFor="community-search">
            <Search size={18} className="absolute left-3 top-3.5 text-[#6a7f80]"/>
            <span className="sr-only">Tìm câu hỏi trong cộng đồng</span>
            <input id="community-search" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Tìm câu hỏi, chủ đề, tác giả…" className="min-h-11 w-full rounded-xl border border-[#d1dfd7] bg-[#fcfdfb] py-2 pl-10 pr-3 text-base"/>
          </label>
          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc theo giai đoạn">
            {topics.map(item=><button type="button" key={item.value} aria-pressed={topic===item.value} onClick={()=>setTopic(item.value)}
              className={"min-h-10 shrink-0 rounded-full px-3.5 text-xs font-bold "+(topic===item.value?"bg-[#173445] text-white":"bg-[#edf5ef] text-[#34585b] hover:bg-[#dceee2]")}>{item.label}</button>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0eb] pt-3">
            <p className="text-xs font-semibold text-[#657a7c]">{visible.length} câu hỏi{questions.length===60?" trong 60 câu gần nhất":""}</p>
            <label className="flex items-center gap-2 text-xs font-bold text-[#365b5b]">Sắp xếp
              <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="min-h-10 rounded-lg border border-[#d7e2dc] bg-white px-2">
                <option value="latest">Mới nhất</option><option value="popular">Quan tâm nhiều</option><option value="unanswered">Chưa có trả lời</option>
              </select>
            </label>
          </div>
        </div>
        {loading&&<div role="status" className="rounded-2xl border bg-white p-5 text-sm">Đang tải câu hỏi thật…</div>}
        {!loading&&!error&&visible.length===0&&<div className="rounded-[22px] border border-dashed border-[#b6d1c5] bg-white p-6 text-center">
          <MessageCircle className="mx-auto text-[#76968c]" size={28}/>
          <p className="mt-3 text-sm font-black text-[#20474f]">Chưa có câu hỏi phù hợp.</p>
          <p className="mt-1 text-xs leading-6 text-[#607778]">Hãy đổi bộ lọc hoặc đặt câu hỏi đầu tiên. Đây không phải dữ liệu mô phỏng.</p>
          <button type="button" onClick={()=>{setTopic("ALL");setSearch("");setSort("latest");}} className={subtle}>Xóa bộ lọc</button>
        </div>}
        {visible.map(q=><article key={q.id} className="overflow-hidden rounded-[22px] border border-[#d8e4dc] bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#657579]">
              <span className="rounded-full bg-[#e5f3ea] px-2.5 py-1 text-[#315f51]">{topicLabel(q.topic)}</span>
              <span>{q.author.fullName} · {q.author.role}</span><span>· {readableDate(q.publishedAt)}</span>
              {q.acceptedCommentId&&<span className="inline-flex items-center gap-1 text-[#2c7851]"><BookmarkCheck size={14}/> Đã chọn câu trả lời</span>}
            </div>
            <h3 className="mt-3 break-words text-lg font-black leading-snug text-[#173445] sm:text-xl">{q.title}</h3>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#526970]">{q.caption}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf0eb] pt-3">
              <button type="button" disabled={busy} aria-pressed={isMyVote(q)} onClick={()=>void toggleVote(q)}
                className={subtle}><ThumbsUp size={16} fill={isMyVote(q)?"#b9ddcb":"none"}/>{q.reactions.filter(r=>r.type==="INSIGHTFUL").length} hữu ích</button>
              <button type="button" disabled={busy} aria-expanded={selectedId===q.id} onClick={()=>void openQuestion(q.id)} className={subtle}>
                <MessageCircle size={16}/>{q._count.comments} trả lời {selectedId===q.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
              </button>
              {(viewer.id===q.author.id||viewer.role==="ADMIN")&&<button type="button" onClick={()=>setConfirmDelete(confirmDelete===q.id?"":q.id)} className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-bold text-[#a45042] hover:bg-[#fff0ea]"><Trash2 size={14}/> Xóa</button>}
            </div>
            {confirmDelete===q.id&&<div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[#fff1e9] p-3 text-xs">
              <span>Xóa câu hỏi và toàn bộ câu trả lời?</span>
              <button type="button" disabled={busy} onClick={()=>void deleteQuestion(q.id)} className="min-h-9 rounded-full bg-[#9e3c31] px-3 font-bold text-white">Xác nhận xóa</button>
              <button type="button" onClick={()=>setConfirmDelete("")} className={subtle}>Hủy</button>
            </div>}
          </div>
          {selectedId===q.id&&<div className="space-y-4 border-t border-[#d8e7df] bg-[#f5f9f5] p-4 sm:p-5" aria-label={"Câu trả lời cho "+q.title}>
            <h4 className="flex items-center gap-2 text-sm font-black text-[#173445]"><Users size={17}/> Thảo luận và câu trả lời</h4>
            {answersLoading&&<p role="status" className="text-xs">Đang tải câu trả lời…</p>}
            {!answersLoading&&answers.length===0&&<p className="text-sm text-[#66817b]">Chưa có ai trả lời. Hãy chia sẻ trải nghiệm hoặc gợi ý có căn cứ.</p>}
            {!answersLoading&&answers.slice().sort((a,b)=>Number(b.id===q.acceptedCommentId)-Number(a.id===q.acceptedCommentId)).map(a=><div key={a.id} className="rounded-xl border border-[#d8e6de] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#3e6062]">{a.author.fullName} · {a.author.role} · {readableDate(a.createdAt)}</p>
                {q.acceptedCommentId===a.id&&<span className="flex items-center gap-1 text-xs font-bold text-[#287550]"><BookmarkCheck size={15}/> Được chọn</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#294d56]">{a.content}</p>
              {(viewer.id===q.author.id||viewer.role==="ADMIN")&&<button type="button" disabled={busy} onClick={()=>void accept(a.id)}
                className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-full border border-[#b4d8c1] px-3 text-xs font-bold text-[#30604c]">
                <Check size={15}/>{q.acceptedCommentId===a.id?"Bỏ đánh dấu":"Chọn câu trả lời"}
              </button>}
            </div>)}
            <form onSubmit={e=>void publishAnswer(e)} className="space-y-2">
              <label htmlFor={"community-answer-"+q.id} className="text-xs font-bold text-[#31535d]">Chia sẻ câu trả lời của bạn</label>
              <textarea id={"community-answer-"+q.id} required minLength={5} maxLength={3000} rows={3} value={answerDraft}
                onChange={e=>setAnswerDraft(e.target.value)} placeholder="Bạn đã thực hiện, quan sát hoặc học được điều gì?"
                className="w-full resize-y rounded-xl border border-[#c6dacf] bg-white p-3 text-base leading-7"/>
              <button type="submit" disabled={busy||answerDraft.trim().length<5} className={primary}><Send size={16}/> Gửi câu trả lời</button>
            </form>
          </div>}
        </article>)}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-5" aria-label="Gợi ý sử dụng cộng đồng">
        <div className="rounded-[22px] border border-[#dfd8c7] bg-[#fff4e2] p-5">
          <div className="flex items-center gap-2 text-[#9d5a30]"><Lightbulb size={18}/><p className="text-xs font-black uppercase tracking-wider">Gợi ý câu hỏi</p></div>
          <h3 className="mt-2 text-base font-black text-[#173445]">Chưa biết bắt đầu ở đâu?</h3>
          <p className="mt-2 text-xs leading-6 text-[#67716f]">Chọn một câu gợi ý để mở biểu mẫu. Đây là đề xuất, không phải bài đăng thật.</p>
          <div className="mt-3 space-y-2">{prompts.map(p=><button key={p} type="button" onClick={()=>{setComposing(true);setTitle(p);setNewTopic(p.includes("prototype")?"PROTOTYPE":"EMPATHIZE");setBody("");}}
            className="block w-full rounded-xl border border-[#ebd8bb] bg-white p-3 text-left text-xs font-bold leading-5 text-[#36535a] hover:border-[#bb9271]">{p} <ArrowRight size={13} className="ml-1 inline"/></button>)}</div>
        </div>
        <div className="rounded-[22px] border border-[#cde0d9] bg-[#e9f5ed] p-5">
          <Sparkles size={20} className="text-[#51876c]"/>
          <h3 className="mt-2 text-base font-black text-[#173445]">Hỏi tốt hơn, học sâu hơn</h3>
          <ol className="mt-2 list-inside list-decimal space-y-2 text-xs leading-6 text-[#486563]">
            <li>Đặt câu hỏi cụ thể và chọn giai đoạn.</li>
            <li>Đưa ví dụ hoặc bằng chứng thay vì chỉ nêu ý kiến.</li>
            <li>Chọn câu trả lời giúp bạn giải quyết vấn đề.</li>
          </ol>
          <Link href="/studio" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#23594a] underline">Đem kết quả vào Design Studio <ArrowRight size={14}/></Link>
        </div>
        <p className="text-xs leading-6 text-[#617679]"><ShieldCheck size={15} className="mr-1 inline"/>Hỏi đáp nội bộ, không tự đăng lên Quora hoặc nền tảng ngoài. Bài đăng được kiểm tra quyền tại API.</p>
      </aside>
    </div>
  </section>;
}
