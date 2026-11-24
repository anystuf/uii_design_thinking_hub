"use client";

import Link from "next/link";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import type {Session} from "@supabase/supabase-js";
import {ArrowRight,Check,Heart,MessageCircle,Plus,RefreshCcw,Send,ShieldCheck,Users} from "lucide-react";
import {WorkspaceNav} from "@/components/workspace-nav";
import {WorkspaceLoading} from "@/components/workspace-loading";
import {SampleTeamGallery} from "@/components/learning-stage-workbench";
import {CommunityQaBoard} from "@/components/community-qa-board";
import {getSupabaseBrowserClient} from "@/lib/supabase-browser";
import {authenticatedApi,workspaceProfile} from "@/lib/authenticated-api";
import {withAuthDeadline} from "@/lib/auth-timeout";
import type {ThinkingStage} from "@/lib/stage-experience";

type Role="STUDENT"|"LECTURER"|"MENTOR"|"ADMIN";
type Viewer={id:string;fullName:string;role:Role};
type Member={id:string;fullName:string;role:Role};
type Comment={id:string;content:string;author:Member;createdAt:string;replies?:Comment[];parentId?:string|null};
type CommunityPost={
 id:string;caption?:string|null;publishedAt:string;author:Member;
 project:{id:string;title:string;description?:string|null;currentStage:ThinkingStage;course:{id:string;title:string}};
 comments:Comment[];reactions:{userId:string;type:string}[];_count:{comments:number;reactions:number};
};
type Project={id:string;title:string;ownerId:string;status:string;courseId:string};

const colors=["#d5ebdf","#ffe6ca","#c8ecf2","#f7dae8"];
const btn="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#173445] px-4 text-sm font-black text-white hover:bg-[#355868] disabled:opacity-50";

export default function CommunityPage(){
 const [session,setSession]=useState<Session|null>(null);
 const [authReady,setAuthReady]=useState(false);
 const [viewer,setViewer]=useState<Viewer|null>(null);
 const [feed,setFeed]=useState<CommunityPost[]>([]);
 const [projects,setProjects]=useState<Project[]>([]);
 const [activePost,setActivePost]=useState("");
 const [comments,setComments]=useState<Comment[]>([]);
 const [draft,setDraft]=useState("");
 const [caption,setCaption]=useState("");
 const [projectId,setProjectId]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [showPublish,setShowPublish]=useState(false);
 const token=session?.access_token||"";
 // The seeded showcase record is not a genuine submission by a live student.
 // Do not mix it into the "real" community activity count or feed.
 const genuinePosts=feed.filter(post=>
   post.project.id!=="44444444-4444-4444-8444-444444444444" &&
   !/^SAMPLE[.:\s-]/i.test(post.project.course?.title||"")
 );
 const shareable=projects.filter(p=>(p.status==="APPROVED"||p.status==="PUBLISHED")&&p.ownerId===viewer?.id);

 useEffect(()=>{
   let active=true;
   try {
     const auth=getSupabaseBrowserClient().auth;
     void withAuthDeadline(()=>auth.getSession()).then(({data})=>{if(active){setSession(data.session);setAuthReady(true);}})
       .catch(()=>{if(active)setAuthReady(true);});
     const {data:{subscription}}=auth.onAuthStateChange((_event,next)=>{if(active)setSession(next);});
     return()=>{active=false;subscription.unsubscribe();};
   }catch{setAuthReady(true);}
 },[]);
 const reload=useCallback(async()=>{
   if(!token)return;
   const [list,mine,me]=await Promise.all([
     authenticatedApi<CommunityPost[]>("/community/feed",token),
     authenticatedApi<Project[]>("/projects",token),
     workspaceProfile<Viewer>(token)
   ]);
   setViewer(me);setFeed(list);setProjects(mine);
 },[token]);
 useEffect(()=>{
   let active=true;
   if(!token){setFeed([]);setViewer(null);return;}
   setLoading(true);setError("");
   void Promise.all([
     authenticatedApi<CommunityPost[]>("/community/feed",token),
     authenticatedApi<Project[]>("/projects",token),
     workspaceProfile<Viewer>(token),
   ]).then(([posts,mine,me])=>{if(active){setFeed(posts);setProjects(mine);setViewer(me);}})
     .catch(e=>{if(active)setError(e instanceof Error?e.message:"Không mở được không gian cộng đồng.");})
     .finally(()=>{if(active)setLoading(false);});
   return()=>{active=false;};
 },[token]);
 async function showComments(id:string){
   if(!token)return;
   if(activePost===id){setActivePost("");return;}
   setError("");setBusy(true);
   try{const items=await authenticatedApi<Comment[]>("/community/posts/"+id+"/comments",token);
     setComments(items);setActivePost(id);
   }catch(e){setError(e instanceof Error?e.message:"Không tải được bình luận.");}
   finally{setBusy(false);}
 }
 async function sendComment(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!token||!activePost||!draft.trim()||busy)return;
   setBusy(true);setError("");setNotice("");
   try{
     await authenticatedApi("/community/posts/"+activePost+"/comments",token,{method:"POST",body:JSON.stringify({content:draft.trim()})});
     setDraft("");
     setComments(await authenticatedApi<Comment[]>("/community/posts/"+activePost+"/comments",token));
     await reload();
     setNotice("Đã đăng bình luận trong cộng đồng.");
   }catch(e){setError(e instanceof Error?e.message:"Không gửi được bình luận.");}
   finally{setBusy(false);}
 }
 async function like(post:CommunityPost){
   if(!token||busy)return;
   setBusy(true);setError("");
   const mine=post.reactions.some(r=>r.userId===viewer?.id&&r.type==="LIKE");
   try{
     await authenticatedApi("/community/posts/"+post.id+"/reactions"+(mine?"/LIKE":""),token,{method:mine?"DELETE":"POST",...(mine?{}:{body:JSON.stringify({type:"LIKE"})})});
     await reload();
   }catch(e){setError(e instanceof Error?e.message:"Không cập nhật được cảm xúc.");}
   finally{setBusy(false);}
 }
 async function publish(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!token||!projectId||busy)return;
   setBusy(true);setError("");setNotice("");
   try{
     await authenticatedApi("/community/posts",token,{method:"POST",body:JSON.stringify({projectId,caption:caption.trim(),visibility:"COMMUNITY"})});
     await reload();
     setCaption("");setShowPublish(false);setNotice("Dự án đã được chia sẻ lên không gian cộng đồng.");
   }catch(e){setError(e instanceof Error?e.message:"Không thể đăng. Dự án cần được phê duyệt và bạn phải là chủ dự án.");}
   finally{setBusy(false);}
 }
 return <div className="uii-workspace min-h-screen">
   <WorkspaceNav title="Cộng đồng sáng tạo" role={viewer?.role} guest={authReady&&!session}/>
   <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-7 sm:py-9">
     <header className="overflow-hidden rounded-[31px] bg-[#d5edc4] p-6 sm:p-10">
       <p className="text-xs font-black uppercase tracking-[.15em] text-[#99503b]">UII COMMUNITY · ASK, ANSWER, SHARE</p>
       <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-.045em] text-[#163844] sm:text-5xl">Cộng đồng học hỏi, hỏi đáp & sáng tạo.</h1>
       <p className="mt-3 max-w-3xl text-sm leading-7 text-[#3d5960]">Hỏi như Quora, trao đổi với bạn học và giảng viên, bình chọn những chia sẻ hữu ích. Đồng thời khám phá dự án Design Thinking đã được duyệt. Mọi hoạt động diễn ra ngay trong UII.</p>
       <div className="mt-5 flex flex-wrap gap-2">
         <Link href="/studio" className={btn}><Users size={17}/> Vào nhóm và Studio <ArrowRight size={16}/></Link>
         <Link href="/learn" className="inline-flex min-h-11 items-center rounded-full border border-[#53716d] bg-white/80 px-4 text-sm font-black text-[#173445]">Quay lại khóa học</Link>
       </div>
     </header>
     {!authReady&&<WorkspaceLoading label="Đang xác minh tài khoản…"/>}
     {authReady&&!session&&<section className="rounded-2xl border border-[#dce4d9] bg-white p-6">
       <p className="text-sm leading-7">Đăng nhập để xem bài chia sẻ đã được duyệt và tham gia bình luận. Bạn vẫn có thể xem hai tình huống minh họa bên dưới.</p>
       <Link href="/learn" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#173445] px-4 text-sm font-bold text-white">Đăng nhập để tham gia <ArrowRight size={17}/></Link>
     </section>}
     {viewer&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce6e0] bg-white p-4">
       <div><p className="text-sm font-black">Chào {viewer.fullName}</p><p className="mt-1 text-xs text-[#5b7177]">Hỏi đáp chung nằm ngay bên dưới; trao đổi riêng của nhóm vẫn ở Studio.</p></div>
       <div className="flex flex-wrap gap-2">
         <button type="button" disabled={busy} onClick={()=>{void reload().catch(e=>setError(e instanceof Error?e.message:"Không tải được bài đăng."));}} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cbdcd6] px-4 text-xs font-black"><RefreshCcw size={16}/> Làm mới</button>
         {shareable.length>0&&<button type="button" aria-expanded={showPublish} onClick={()=>setShowPublish(x=>!x)} className={btn}><Plus size={16}/> Đăng dự án đã duyệt</button>}
       </div>
     </div>}
     {showPublish&&viewer&&<form onSubmit={e=>void publish(e)} className="space-y-3 rounded-2xl border border-[#d8e6dd] bg-white p-5">
       <h2 className="text-lg font-black text-[#173445]">Đăng dự án của nhóm lên cộng đồng</h2>
       <p className="text-xs leading-6 text-[#647779]">Chỉ chủ dự án được tự chọn công bố dự án đã được giảng viên duyệt để trưng bày; quản trị viên không tự đăng thay chủ dự án. Bài đăng hiển thị cho thành viên đăng nhập. Không đăng thông tin cá nhân của người được phỏng vấn.</p>
       <label htmlFor="share-project" className="block text-sm font-bold">Dự án đã duyệt</label>
       <select id="share-project" required value={projectId} onChange={e=>setProjectId(e.target.value)} className="min-h-11 w-full rounded-xl border bg-white px-3">
         <option value="">Chọn dự án</option>{shareable.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
       </select>
       <label htmlFor="share-caption" className="block text-sm font-bold">Giới thiệu dự án và điều cần phản hồi</label>
       <textarea id="share-caption" required maxLength={2000} rows={4} value={caption} onChange={e=>setCaption(e.target.value)}
         placeholder="Nhóm đang kiểm chứng giả định nào? Mời các nhóm góp ý về điểm chưa rõ…" className="w-full resize-y rounded-xl border p-3 text-base"/>
       <button disabled={busy||!projectId||!caption.trim()} className={btn}>Công bố trong cộng đồng <ArrowRight size={16}/></button>
     </form>}
     {error&&<p role="alert" className="rounded-xl border border-[#eab9b0] bg-[#fff2ec] p-4 text-sm text-[#933d31]">{error}</p>}
     {notice&&<p role="status" className="rounded-xl border border-[#cce8d4] bg-[#e9f6ed] p-4 text-sm text-[#215944]"><Check size={17} className="mr-2 inline"/>{notice}</p>}
     {viewer&&<CommunityQaBoard token={token} viewer={viewer}/>}
     {viewer&&<section aria-labelledby="real-feed-heading">
       <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
         <div><p className="text-xs font-black uppercase tracking-[.15em] text-[#aa4831]">PROJECT SHOWCASE · DỮ LIỆU THẬT</p>
           <h2 id="real-feed-heading" className="mt-1 text-xl font-black text-[#173445] sm:text-2xl">Dự án được chia sẻ trong UII</h2></div>
         <span className="rounded-full bg-[#f0f6ed] px-3 py-2 text-xs font-bold text-[#43605a]">{genuinePosts.length} dự án đã công bố</span>
       </div>
       {loading&&<WorkspaceLoading label="Đang tải dự án cộng đồng…"/>}
       {!loading&&genuinePosts.length===0&&<p className="rounded-2xl border border-[#dce9dd] bg-white p-5 text-sm leading-7 text-[#567077]">Chưa có bài chia sẻ từ các dự án đã được duyệt. Hai ví dụ bên dưới là minh họa, không phải bài đăng thật.</p>}
       <div className="grid gap-4 lg:grid-cols-2">{genuinePosts.map((post,index)=>(
         <article key={post.id} className="overflow-hidden rounded-[24px] border border-[#dce5dd] bg-white shadow-sm">
           <div className="p-5 sm:p-6" style={{backgroundColor:colors[index%colors.length]}}>
             <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#7b4336]"><span>ĐÃ CÔNG BỐ · DỰ ÁN THẬT</span><span>• {post.project.currentStage}</span></div>
             <h3 className="mt-2 text-xl font-black tracking-tight text-[#173445]">{post.project.title}</h3>
             <p className="mt-2 text-sm leading-6 text-[#365660]">{post.project.description||"Dự án đang được trình bày bởi nhóm."}</p>
           </div>
           <div className="space-y-3 p-5">
             <p className="text-xs font-bold text-[#566d74]">Đăng bởi {post.author?.fullName} · {post.project.course?.title}</p>
             {post.caption&&<p className="whitespace-pre-wrap break-words text-sm leading-7">{post.caption}</p>}
             <div className="flex flex-wrap items-center gap-2">
               <button type="button" disabled={busy} onClick={()=>void like(post)} aria-pressed={post.reactions.some(x=>x.userId===viewer.id&&x.type==="LIKE")}
                 className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d5e1db] px-3 text-xs font-black text-[#193e47]">
                 <Heart size={16} fill={post.reactions.some(x=>x.userId===viewer.id&&x.type==="LIKE")?"#db6a61":"none"}/> {post._count.reactions} quan tâm
               </button>
               <button type="button" disabled={busy} onClick={()=>void showComments(post.id)} aria-expanded={activePost===post.id}
                 className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d5e1db] px-3 text-xs font-black">
                 <MessageCircle size={16}/> {post._count.comments} bình luận
               </button>
               <Link className="inline-flex min-h-11 items-center gap-1 text-xs font-black text-[#173445] underline" href={"/studio?course="+encodeURIComponent(post.project.course.id)+"&mode="+post.project.currentStage}>Khám phá Studio <ArrowRight size={14}/></Link>
             </div>
             {activePost===post.id&&<section className="space-y-3 rounded-2xl border border-[#dce6de] bg-[#f7f9f4] p-3" aria-label={"Trao đổi dự án "+post.project.title}>
               {comments.length===0&&<p className="text-xs text-[#697b7a]">Chưa có bình luận. Hãy đặt câu hỏi đầu tiên.</p>}
               {comments.map(c=><div key={c.id} className="rounded-xl bg-white p-3">
                 <p className="text-xs font-black text-[#284650]">{c.author?.fullName} · {c.author?.role}</p>
                 <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{c.content}</p>
                 {c.replies?.map(reply=><div key={reply.id} className="ml-4 mt-2 rounded-lg bg-[#e7f5ed] p-2 text-sm">
                   <strong className="text-xs">{reply.author?.fullName}:</strong> <span>{reply.content}</span>
                 </div>)}
               </div>)}
               <form onSubmit={e=>void sendComment(e)} className="space-y-2">
                 <label className="block text-xs font-black" htmlFor={"comment-"+post.id}>Bình luận hoặc hỏi giảng viên</label>
                 <textarea required id={"comment-"+post.id} maxLength={2000} rows={3} value={draft} onChange={e=>setDraft(e.target.value)}
                   placeholder="Nhóm đã thử nghiệm giả định này với người dùng chưa?" className="w-full resize-y rounded-xl border border-[#cdded4] bg-white p-3 text-base"/>
                 <button disabled={!draft.trim()||busy} className={btn}><Send size={16}/> Gửi bình luận</button>
               </form>
             </section>}
           </div>
         </article>
       ))}</div>
     </section>}
     <section aria-labelledby="samples-heading" className="space-y-4">
       <div><p className="text-xs font-black uppercase tracking-[.14em] text-[#aa4d34]">HOW IT WORKS · DEMO ONLY</p>
         <h2 id="samples-heading" className="mt-1 text-xl font-black text-[#173445] sm:text-2xl">Hình dung hai nhóm cùng học Design Thinking</h2></div>
       <SampleTeamGallery stage="EMPATHIZE"/>
       <div className="rounded-2xl border border-[#dce6df] bg-[#e7f3ed] p-4 text-xs leading-6 text-[#466268]">
         <p className="flex items-center gap-2 font-black text-[#214e4c]"><ShieldCheck size={16}/> Riêng tư và nguồn lực</p>
         UII chỉ lưu văn bản phản hồi, liên kết dự án và tương tác nhỏ trên backend hiện có. Không tự đồng bộ hay công khai Facebook cá nhân. Bảng Miro hoặc Padlet có thể mở/nhúng riêng nếu chủ bảng cho phép; dữ liệu người tham gia vẫn phải được xin phép trước khi đăng công khai.
       </div>
     </section>
   </main>
 </div>;
}
