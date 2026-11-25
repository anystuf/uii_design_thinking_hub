"use client";

import Link from "next/link";
import {useEffect,useState,type FormEvent} from "react";
import {BookOpen, Bell, FolderKanban, Save, Plus, Eye, ArrowRight, Clock3} from "lucide-react";
import {WorkspaceNav} from "@/components/workspace-nav";
import {WorkspaceLoading} from "@/components/workspace-loading";
import {authenticatedApi} from "@/lib/authenticated-api";
import {getSupabaseBrowserClient} from "@/lib/supabase-browser";
import {withAuthDeadline} from "@/lib/auth-timeout";

type User={id:string;role:"STUDENT"|"LECTURER"|"ADMIN"|"MENTOR";fullName:string};
type Lesson={id:string;title:string;description?:string|null;content?:string|null;durationMinutes:number;publishedAt:string|null;orderIndex:number;contentType:string;videoUrl?:string|null};
type Course={id:string;title:string;description?:string|null;level:string;status:"DRAFT"|"PUBLISHED"|"ARCHIVED";createdById:string;lessons?:Lesson[];_count?:{lessons:number}};
type Project={id:string;title:string;description?:string|null;status:string;ownerId:string;courseId:string};
type Tab="courses"|"announcements"|"showcase";
const field="mt-2 min-h-11 w-full rounded-xl border border-[#cddbd1] bg-white p-3 text-base focus-visible:outline-[#346c67]";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173445] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const secondary="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cbded1] bg-white px-4 py-2.5 text-sm font-bold text-[#173445]";
const titleStyle="block text-sm font-bold text-[#2e5357]";

export default function ContentConsole(){
  const [user,setUser]=useState<User|null>(null);
  const [token,setToken]=useState("");
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [tab,setTab]=useState<Tab>("courses");
  const [courses,setCourses]=useState<Course[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [selected,setSelected]=useState<Course|null>(null);
  const [creating,setCreating]=useState(false);
  const [courseTitle,setCourseTitle]=useState("");
  const [courseDescription,setCourseDescription]=useState("");
  const [level,setLevel]=useState("Foundation");
  const [status,setStatus]=useState<Course["status"]>("DRAFT");
  const [editLessonId,setEditLessonId]=useState("");
  const [lessonTitle,setLessonTitle]=useState("");
  const [lessonDescription,setLessonDescription]=useState("");
  const [lessonContent,setLessonContent]=useState("");
  const [lessonType,setLessonType]=useState("ARTICLE");
  const [lessonVideoUrl,setLessonVideoUrl]=useState("");
  const [lessonOrder,setLessonOrder]=useState(0);
  const [lessonMinutes,setLessonMinutes]=useState(15);
  const [lessonPublished,setLessonPublished]=useState(false);
  const [annTitle,setAnnTitle]=useState("");
  const [annBody,setAnnBody]=useState("");
  const [annAudience,setAnnAudience]=useState<"COURSE"|"ALL_STUDENTS">("COURSE");
  const [annCourse,setAnnCourse]=useState("");
  const canEdit=user?.role==="ADMIN"||user?.role==="LECTURER";
  const editable=courses.filter(c=>user?.role==="ADMIN"||c.createdById===user?.id);
  const duration=(selected?.lessons??[]).reduce((sum,l)=>sum+(l.durationMinutes||0),0);

  useEffect(()=>{
    let active=true;
    async function load(){
      try{
        const session=await withAuthDeadline(()=>getSupabaseBrowserClient().auth.getSession());
        if(session.error)throw session.error;
        const key=session.data.session?.access_token;
        if(!key)return;
        const viewer=await authenticatedApi<User>("/auth/me",key);
        if(!active)return;
        setUser(viewer);setToken(key);
        if(viewer.role==="LECTURER"||viewer.role==="ADMIN"){
          const [rows,projectRows]=await Promise.all([
            authenticatedApi<Course[]>("/courses",key),
            authenticatedApi<Project[]>("/projects",key),
          ]);
          if(!active)return;
          setCourses(rows);setProjects(projectRows);
          const requested=new URLSearchParams(location.search).get("course");
          if(requested&&rows.some(row=>row.id===requested&&(viewer.role==="ADMIN"||row.createdById===viewer.id))){
            const detail=await authenticatedApi<Course>("/courses/"+encodeURIComponent(requested),key);
            if(active){setSelected(detail);setForm(detail);}
          }
        }
      }catch(e){if(active)setError(e instanceof Error?e.message:"Could not load Course Console.");}
      finally{if(active)setReady(true);}
    }
    void load();return()=>{active=false;};
  },[]);

  function setForm(c:Course){setCourseTitle(c.title);setCourseDescription(c.description??"");setLevel(c.level);setStatus(c.status);setCreating(false);setEditLessonId("");}
  async function run(action:()=>Promise<void>){
    if(busy)return;setBusy(true);setError("");setSuccess("");
    try{await action();}
    catch(e){setError(e instanceof Error?e.message:"Save failed.");}
    finally{setBusy(false);}
  }
  async function refresh(id:string){
    const [items,detail]=await Promise.all([
      authenticatedApi<Course[]>("/courses",token),
      authenticatedApi<Course>("/courses/"+encodeURIComponent(id),token),
    ]);
    setCourses(items);setSelected(detail);setForm(detail);
  }
  function newCourse(){
    setSelected(null);setCreating(true);setCourseTitle("");setCourseDescription("");setLevel("Foundation");setStatus("DRAFT");setEditLessonId("");
    history.replaceState(null,"","/console");
  }
  async function openCourse(id:string){
    await run(async()=>{const item=await authenticatedApi<Course>("/courses/"+encodeURIComponent(id),token);setSelected(item);setForm(item);history.replaceState(null,"","/console?course="+encodeURIComponent(id));});
  }
  async function saveCourse(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    await run(async()=>{
      if(!courseTitle.trim())throw Error("Enter a course title.");
      const data={title:courseTitle.trim(),description:courseDescription.trim(),level:level.trim(),status:selected?status:"DRAFT"};
      const item=await authenticatedApi<Course>(selected?"/courses/"+selected.id:"/courses",token,{
        method:selected?"PUT":"POST",body:JSON.stringify(data),
      });
      await refresh(item.id);history.replaceState(null,"","/console?course="+encodeURIComponent(item.id));
      setSuccess(selected?"Course saved.":"Course draft created. Add lessons before publishing.");
    });
  }
  function beginLesson(lesson?:Lesson){
    setEditLessonId(lesson?.id??"new");setLessonTitle(lesson?.title??"");
    setLessonDescription(lesson?.description??"");setLessonContent(lesson?.content??"");
    setLessonMinutes(lesson?.durationMinutes??15);setLessonPublished(!!lesson?.publishedAt);
    setLessonType(lesson?.contentType??"ARTICLE");setLessonVideoUrl(lesson?.videoUrl??"");setLessonOrder(lesson?.orderIndex??selected?.lessons?.length??0);
  }
  async function saveLesson(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!selected)return;
    const courseId=selected.id;
    await run(async()=>{
      const duration=Math.round(lessonMinutes);
      if(!Number.isInteger(duration)||duration<0||duration>600)throw Error("Duration must be between 0 and 600 minutes.");
      await authenticatedApi(editLessonId==="new"?"/courses/"+courseId+"/lessons":"/lessons/"+editLessonId,token,{
        method:editLessonId==="new"?"POST":"PUT",
        body:JSON.stringify({
          title:lessonTitle.trim(),description:lessonDescription.trim(),content:lessonContent.trim(),
          durationMinutes:duration,isPublished:lessonPublished,
          contentType:lessonType,videoUrl:lessonVideoUrl.trim(),orderIndex:lessonOrder,
        }),
      });
      await refresh(courseId);
      setSuccess("Lesson saved. The course duration has been recalculated from individual lesson durations.");
    });
  }
  async function approveProjectForShowcase(projectId:string){
    await run(async()=>{
      await authenticatedApi("/projects/"+encodeURIComponent(projectId)+"/approve-showcase",token,{method:"POST"});
      setProjects(await authenticatedApi<Project[]>("/projects",token));
      setSuccess("Project approved for exhibition. The owner has been notified, but the project is NOT public until its owner chooses to publish it.");
    });
  }
  async function sendAnnouncement(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    await run(async()=>{
      if(annAudience==="COURSE"&&!annCourse)throw Error("Select a course before sending an announcement.");
      const result=await authenticatedApi<{sent:number}>("/notifications/announcements",token,{
        method:"POST",body:JSON.stringify({
          title:annTitle.trim(),body:annBody.trim(),audience:annAudience,
          ...(annAudience==="COURSE"?{courseId:annCourse}:{}),
        }),
      });
      setSuccess(result.sent?"Announcement sent to "+result.sent+" recipients.":"There are no enrolled students, so the announcement was not sent.");
      setAnnTitle("");setAnnBody("");
    });
  }

  return <div className="uii-workspace min-h-screen bg-[#f8f8f1] text-[#173445]">
    <WorkspaceNav title="Console" role={user?.role}/>
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6">
      <header className="rounded-[25px] border border-[#d3e2d8] bg-[#eaf4ec] p-6">
        <p className="text-xs font-black uppercase tracking-[.15em] text-[#a24b34]">UII CONTENT CONSOLE</p>
        <h1 className="mt-2 text-3xl font-black">Course Console</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#57716e]">Create and publish courses, set lesson durations, preview content, and send announcements. Changes take effect only after the server confirms a save.</p>
      </header>
      {!ready&&<WorkspaceLoading label="Verifying your access…"/>}
      {ready&&!token&&<p className="rounded-2xl bg-white p-6">You must <Link href="/learn" className="font-bold underline">sign in</Link>.</p>}
      {ready&&user&&!canEdit&&<p role="alert" className="rounded-2xl bg-white p-6">Course Console is available only to lecturers and administrators. <Link href="/learn" className="font-bold underline">Back to Learning Hub</Link>.</p>}
      {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {success&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{success}</p>}
      {ready&&canEdit&&<div className="grid items-start gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav aria-label="Console sections" className="space-y-2 rounded-2xl border border-[#d6e4d9] bg-white p-3 lg:sticky lg:top-6">
          {([{id:"courses",text:"Khóa học",icon:BookOpen},{id:"announcements",text:"Thông báo",icon:Bell},{id:"showcase",text:"Project showcase",icon:FolderKanban}] as const).map(t=><button key={t.id} type="button" onClick={()=>{setTab(t.id);setError("");setSuccess("");}} aria-current={tab===t.id?"page":undefined} className={"flex min-h-11 w-full items-center gap-2 rounded-xl p-3 text-left text-sm font-bold "+(tab===t.id?"bg-[#dcefe4]":"hover:bg-[#f0f6f2]")}><t.icon size={17}/>{t.text}</button>)}
        </nav>
        <div className="min-w-0 space-y-5">
          {tab==="courses"&&<>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-2xl font-black">Manage courses</h2><p className="text-sm text-[#5d7573]">Create a draft → edit details → add lessons → preview → publish.</p></div>
              <button type="button" onClick={newCourse} className={primary}><Plus size={17}/> Create course</button>
            </div>
            <div className="grid gap-4 xl:grid-cols-[245px_minmax(0,1fr)]">
              <section className="space-y-2 rounded-2xl border border-[#d9e5dc] bg-white p-4" aria-label="Course list">
                <h3 className="text-sm font-black">Your courses ({editable.length})</h3>
                {editable.map(c=><button type="button" key={c.id} onClick={()=>void openCourse(c.id)} aria-pressed={selected?.id===c.id}
                  className={"min-h-16 w-full rounded-xl border p-3 text-left text-sm "+(selected?.id===c.id?"border-[#558a71] bg-[#e7f4ec]":"border-[#e1ebe4] hover:bg-[#f7faf8]")}>
                  <span className="block font-bold">{c.title}</span><span className="mt-1 block text-xs text-[#627772]">{c.status==="PUBLISHED"?"Published":"Draft / archived"} · {c._count?.lessons??0} lessons</span>
                </button>)}
                {!editable.length&&<p className="text-sm text-[#69817b]">No courses yet.</p>}
              </section>
              <div className="min-w-0 space-y-4">
                {(selected||creating)&&<form onSubmit={e=>void saveCourse(e)} className="space-y-4 rounded-2xl border border-[#d9e5dc] bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black">{selected?"Edit course":"New course"}</h3>
                    {selected&&<Link href={"/learn?course="+encodeURIComponent(selected.id)} className={secondary}><Eye size={16}/> Preview</Link>}</div>
                  <label className={titleStyle}>Course title<input required maxLength={160} value={courseTitle} onChange={e=>setCourseTitle(e.target.value)} className={field}/></label>
                  <label className={titleStyle}>Course overview<textarea rows={4} maxLength={1200} value={courseDescription} onChange={e=>setCourseDescription(e.target.value)} className={field}/></label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className={titleStyle}>Level<input required maxLength={80} value={level} onChange={e=>setLevel(e.target.value)} className={field}/></label>
                    <label className={titleStyle}>Status<select disabled={!selected} value={selected?status:"DRAFT"} onChange={e=>setStatus(e.target.value as Course["status"])} className={field}>
                      <option value="DRAFT">Draft</option><option value="PUBLISHED">Published · Open for enrollment</option><option value="ARCHIVED">Archived</option>
                    </select></label>
                  </div>
                  <p className="text-xs leading-6 text-[#698079]">Tổng thời lượng được tự động tính từ từng lessons học, không nhập hai lần.</p>
                  <button disabled={busy} className={primary}><Save size={17}/> {selected?"Save changes":"Create course nháp"}</button>
                </form>}
                {selected&&<section className="space-y-4 rounded-2xl border border-[#d9e5dc] bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><h3 className="text-lg font-black">Course syllabus</h3><p className="mt-1 flex items-center gap-1 text-xs text-[#487567]"><Clock3 size={15}/>{duration} min · {selected.lessons?.length??0} lessons</p></div>
                    <button type="button" className={secondary} onClick={()=>beginLesson()}><Plus size={16}/> Thêm lessons</button>
                  </div>
                  {selected.lessons?.map((lesson,i)=><div key={lesson.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5ece5] p-3">
                    <div><p className="text-sm font-bold">{i+1}. {lesson.title}</p><p className="text-xs text-[#697e78]">{lesson.durationMinutes} min · {lesson.publishedAt?"Published":"Draft"}</p></div>
                    <button type="button" onClick={()=>beginLesson(lesson)} className={secondary}>Edit</button>
                  </div>)}
                  {editLessonId&&<form onSubmit={e=>void saveLesson(e)} className="space-y-3 rounded-xl bg-[#f1f7f3] p-4">
                    <h4 className="font-black">{editLessonId==="new"?"Tạo lessons học":"Edit lessons học"}</h4>
                    <label className={titleStyle}>Tên lessons học<input required maxLength={160} value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} className={field}/></label>
                    <label className={titleStyle}>Description<input maxLength={1200} value={lessonDescription} onChange={e=>setLessonDescription(e.target.value)} className={field}/></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={titleStyle}>Duration (minutes)<input required type="number" min={0} max={600} value={lessonMinutes} onChange={e=>setLessonMinutes(Number(e.target.value))} className={field}/></label>
                      <label className={titleStyle}>Thứ tự lessons học<input required type="number" min={0} max={500} value={lessonOrder} onChange={e=>setLessonOrder(Number(e.target.value))} className={field}/></label>
                    </div>
                    <label className={titleStyle}>Loại lessons học<select value={lessonType} onChange={e=>setLessonType(e.target.value)} className={field}>
                      <option value="ARTICLE">Article</option><option value="VIDEO">Video</option><option value="WORKSHOP">Workshop</option><option value="TEMPLATE">Template</option><option value="ASSIGNMENT">Assignment</option>
                    </select></label>
                    <label className={titleStyle}>Video / linked resource (URL)<input type="url" maxLength={500} placeholder="https://..." value={lessonVideoUrl} onChange={e=>setLessonVideoUrl(e.target.value)} className={field}/></label>
                    <label className={titleStyle}>Content<textarea maxLength={10000} rows={6} value={lessonContent} onChange={e=>setLessonContent(e.target.value)} className={field}/></label>
                    <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" checked={lessonPublished} onChange={e=>setLessonPublished(e.target.checked)}/> Công bố lessons học</label>
                    <div className="flex flex-wrap gap-2"><button disabled={busy} className={primary}><Save size={16}/> Lưu lessons học</button><button type="button" disabled={busy} className={secondary} onClick={()=>setEditLessonId("")}>Cancel</button></div>
                  </form>}
                </section>}
                {!selected&&!creating&&<div className="rounded-2xl border border-dashed border-[#bad2c3] bg-white p-8 text-center text-sm text-[#59746f]">Select a course to edit, or create a new one.</div>}
              </div>
            </div>
          </>}
          {tab==="announcements"&&<section className="space-y-4 rounded-2xl border border-[#d9e5dc] bg-white p-6" aria-labelledby="ann-title">
            <p className="text-xs font-black tracking-wider text-[#ad563e]">COMMUNICATION CONSOLE</p>
            <h2 id="ann-title" className="text-2xl font-black">Send announcement</h2>
            <p className="text-sm leading-7 text-[#607774]">Lecturers can notify students enrolled in their courses. Administrators can notify all students. Recipients read announcements in Notifications.</p>
            <form onSubmit={e=>void sendAnnouncement(e)} className="space-y-4">
              <label className={titleStyle}>Audience<select value={annAudience} onChange={e=>setAnnAudience(e.target.value as typeof annAudience)} className={field}>
                <option value="COURSE">Students in one course</option>{user?.role==="ADMIN"&&<option value="ALL_STUDENTS">All students</option>}
              </select></label>
              {annAudience==="COURSE"&&<label className={titleStyle}>Choose course<select required value={annCourse} onChange={e=>setAnnCourse(e.target.value)} className={field}>
                <option value="">Choose course</option>{editable.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
              </select></label>}
              <label className={titleStyle}>Title<input required minLength={4} maxLength={120} value={annTitle} onChange={e=>setAnnTitle(e.target.value)} className={field}/></label>
              <label className={titleStyle}>Content<textarea required minLength={10} maxLength={1500} rows={6} value={annBody} onChange={e=>setAnnBody(e.target.value)} className={field}/></label>
              <div className="rounded-xl bg-[#f2f7f3] p-4 text-sm leading-7"><b>Preview:</b><p className="mt-2 whitespace-pre-wrap break-words">{annTitle||"Title thông báo"}</p><p className="mt-2 whitespace-pre-wrap break-words">{annBody||"Content thông báo"}</p></div>
              <button disabled={busy} className={primary}><Bell size={16}/> Send announcement ngay</button>
              <p className="text-xs text-[#698079]">Announcements are sent immediately after server confirmation; scheduling and server-side drafts are not supported yet.</p>
            </form>
          </section>}
          {tab==="showcase"&&<section className="space-y-4 rounded-2xl border border-[#d9e5dc] bg-white p-6">
            <h2 className="text-2xl font-black">Project showcase workflow</h2>
            <p className="text-sm leading-7 text-[#5d7471]">Projects must be submitted and assessed before appearing in Community. Lecturer approval does not publish them automatically; project owners decide whether to share.</p>
            <div className="rounded-xl border border-[#d8e6dc] bg-[#f6faf7] p-4">
              <h3 className="text-base font-black">Approve course projects</h3>
              <p className="mt-1 text-xs leading-6 text-[#657a76]">Only approve a project after an APPROVED assessment exists for a submitted version. This action does not publish anything to Community.</p>
              <div className="mt-3 space-y-2">{projects.map(project=><div key={project.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e0e9e1] bg-white p-3">
                <div><p className="text-sm font-bold">{project.title}</p><p className="text-xs text-[#667a77]">{project.status==="PUBLISHED"?"Exhibited":project.status==="APPROVED"?"Approved":"Not eligible for display"}</p></div>
                {!["APPROVED","PUBLISHED"].includes(project.status)&&<button type="button" disabled={busy} onClick={()=>void approveProjectForShowcase(project.id)} className={secondary}>Approve showcase</button>}
              </div>)}</div>
              {!projects.length&&<p className="mt-3 text-sm text-[#647a76]">No projects found in your managed courses.</p>}
            </div>
            <ol className="list-inside list-decimal space-y-2 text-sm leading-7 text-[#365b59]">
              <li>Student teams complete a project and save evidence in Studio.</li>
              <li>Teams submit a version for lecturer review and approval.</li>
              <li>The lecturer assesses it in Review; the project status is updated.</li>
              <li>The project owner opens Community → Add approved project → Write an introduction → Publish.</li>
            </ol>
            <div className="flex flex-wrap gap-2"><Link href="/review" className={secondary}>Open Review <ArrowRight size={15}/></Link><Link href="/community" className={secondary}>Xem lessons dự án <Eye size={15}/></Link></div>
            <p className="text-xs text-[#73817b]">Nhóm mô phỏng trong tab Cộng đồng chỉ minh họa quy trình, không tạo lessons đăng thật.</p>
          </section>}
        </div>
      </div>}
    </main>
  </div>;
}
