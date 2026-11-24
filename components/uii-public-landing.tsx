import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2,
  ChevronRight, Lightbulb, MapPin, MousePointer2,
  PenLine, Play, Rocket, Sparkles, Users, WandSparkles,
} from "lucide-react";
import { DemoPhoto } from "@/components/demo-photo";
import { NonLinearModes } from "@/components/non-linear-modes";
import {
  DEMO_COURSES, DEMO_EVENTS, DEMO_EXERCISES, DEMO_PHOTOS, DEMO_PROJECTS,
  DEMO_QUOTES, DEMO_TOOLS,
} from "@/lib/demo-content";

function Eyebrow({children,dark=false}:{children:React.ReactNode;dark?:boolean}) {
  return <p className={"text-[11px] font-black uppercase tracking-[0.19em] "+(dark?"text-[#7a2d13]":"text-[#ffc88c]")}>{children}</p>;
}
function SectionTitle({eyebrow,title,desc}:{eyebrow:string;title:string;desc:string}) {
  return <div className="max-w-[800px] space-y-4">
    <Eyebrow dark>{eyebrow}</Eyebrow>
    <h2 className="font-[family-name:var(--font-sans-ui)] text-[clamp(2rem,4.2vw,4.35rem)] font-extrabold leading-[1.09] tracking-[-0.048em] text-[#122630]">{title}</h2>
    <p className="max-w-2xl text-sm leading-7 text-[#405861] sm:text-[17px] sm:leading-8">{desc}</p>
  </div>;
}
function DemoFlag({light=false}:{light?:boolean}) {
  return <span className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider "+(light?"bg-white/20 text-white":"bg-[#ffedcd] text-[#82410f]")}>
    <span className="size-2 rounded-full bg-[#ef573b]"/> Nội dung minh họa · Demo
  </span>;
}

export function UIIPublicLanding() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#faf8f1] text-[#132a35]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded-lg focus:bg-white focus:p-4">Đến nội dung chính</a>
      <header className="sticky top-0 z-40 border-b border-[#dbe1da] bg-[#faf8f1]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1500px] items-center justify-between gap-3 px-5 sm:px-9 xl:px-14">
          <Link href="/" aria-label="UII Design Thinking Hub — Trang chủ" className="inline-flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#152d3e] text-[15px] font-black text-white">UII</span>
            <span className="text-[13px] font-black leading-tight tracking-tight sm:text-[15px]">Design Thinking<br/>Hub</span>
          </Link>
          <nav aria-label="Điều hướng trang chủ" className="hidden items-center gap-6 text-[13px] font-bold text-[#354d55] xl:flex">
            <a href="#how" className="hover:text-[#c04425]">Cách học</a>
            <a href="#courses" className="hover:text-[#c04425]">Khóa học</a>
            <a href="#tools" className="hover:text-[#c04425]">Công cụ</a>
            <a href="#projects" className="hover:text-[#c04425]">Dự án</a>
            <a href="#events" className="hover:text-[#c04425]">Workshops</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/demo" className="hidden min-h-11 items-center rounded-full border border-[#1b3848] px-5 text-xs font-extrabold text-[#1b3848] transition hover:bg-white sm:inline-flex">Thử bài tập demo</Link>
            <Link href="/learn" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#173445] px-4 text-xs font-extrabold text-white transition hover:bg-[#244b60] sm:px-5">Vào học <ArrowUpRight size={16} aria-hidden="true"/></Link>
          </div>
        </div>
        <nav aria-label="Điều hướng nhanh trên điện thoại" className="flex gap-6 overflow-x-auto border-t border-[#e6e8e1] px-5 py-2.5 text-xs font-bold text-[#354d55] xl:hidden sm:px-9">
          <a className="shrink-0" href="#how">Cách học</a>
          <a className="shrink-0" href="#courses">Khóa học</a>
          <a className="shrink-0" href="#tools">Công cụ</a>
          <a className="shrink-0" href="#projects">Dự án</a>
          <a className="shrink-0" href="#events">Sự kiện</a>
        </nav>
      </header>

      <main id="main">
        <section className="relative isolate overflow-hidden bg-[#bdebf6]" aria-labelledby="homepage-hero">
          <div className="pointer-events-none absolute -right-16 top-5 h-[430px] w-[430px] rounded-full border-[55px] border-[#fae78b]/70 opacity-70" aria-hidden="true" />
          <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-5 pb-16 pt-14 sm:px-9 sm:pt-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:py-24 xl:px-14">
            <div className="relative z-10">
              <Eyebrow dark>CREATIVITY IS A PRACTICE · UII</Eyebrow>
              <h1 id="homepage-hero" className="mt-5 max-w-[810px] font-[family-name:var(--font-sans-ui)] text-[clamp(3.35rem,6.4vw,6.7rem)] font-black leading-[0.97] tracking-[-0.073em]">
                Ideas come <span className="relative inline-block">alive
                  <svg className="absolute -bottom-4 left-0 w-full text-[#e84636]" viewBox="0 0 430 32" fill="none" aria-hidden="true"><path d="M8 17C77 5 148 28 226 14S347 7 422 17" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></svg>
                </span><br/>when we <span className="text-[#a82b21]">make.</span>
              </h1>
              <p className="mt-11 max-w-[590px] text-xl font-bold leading-8 sm:text-[24px] sm:leading-9">Học Design Thinking bằng cách bắt tay vào làm.</p>
              <p className="mt-4 max-w-[550px] text-[15px] leading-8 text-[#30545c]">Khám phá bài học, phỏng vấn người dùng, phát triển ý tưởng, tạo nguyên mẫu và thử nghiệm. Một không gian sáng tạo dành cho sinh viên, giảng viên và những người muốn tạo tác động tích cực.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/demo" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#ba3024] px-7 py-3 text-sm font-black text-white shadow-[0_8px_0_#d63a2b] transition hover:-translate-y-0.5 hover:bg-[#94251e]">Trải nghiệm bài học <ArrowRight size={18}/></Link>
                <Link href="/demo#studio-self-guided" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#d6e0d5] bg-white/90 px-6 text-sm font-black text-[#173445] hover:bg-white">Thử Design Studio tự hướng dẫn <ArrowRight size={17}/></Link>
                <Link href="/learn" className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#163445] bg-white px-7 py-3 text-sm font-extrabold text-[#163445] hover:bg-[#faf8f1]">Khám phá khóa học <BookOpen size={17}/></Link>
              </div>
              <div className="mt-11 flex flex-wrap items-center gap-3">
                <DemoFlag/>
                <span className="text-xs font-semibold text-[#3a5a63]">Bản giới thiệu với hoạt động minh họa, không phải số liệu người dùng thực tế.</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
              <div className="group relative aspect-[5/5.4] overflow-hidden rounded-[34px] border-[10px] border-[#fffdf4] bg-[#f9e4a7] shadow-[0_26px_60px_rgba(16,47,57,.19)] sm:aspect-[5/4.6]">
                <DemoPhoto src={DEMO_PHOTOS.workshop} alt="Những người trẻ thảo luận, trao đổi ý tưởng trong một buổi workshop" priority className="absolute inset-0 h-full w-full" tint="#fce5b2"/>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#142835]/85 to-transparent px-6 pb-6 pt-20 text-white">
                  <span className="text-xs font-black uppercase tracking-[.16em]">Think / Make / Learn</span>
                  <p className="mt-1 text-2xl font-black leading-tight">Your curiosity<br/>can change things.</p>
                </div>
              </div>
              <div className="pointer-events-none absolute -left-4 top-1/4 rotate-[-11deg] rounded-lg bg-[#fff29d] px-5 py-4 text-sm font-black text-[#172e3a] shadow-xl sm:-left-9">What if…? <Lightbulb className="ml-3 inline" size={20} aria-hidden="true"/></div>
              <div className="pointer-events-none absolute -right-4 top-10 rotate-[10deg] rounded-lg bg-[#f48a82] px-5 py-4 text-xs font-black text-[#282b2a] shadow-xl sm:-right-9">MAKE IT REAL! <Sparkles className="inline" size={18} aria-hidden="true"/></div>
              <svg aria-hidden="true" className="pointer-events-none absolute -bottom-6 -left-7 h-20 w-40 text-[#ed4539]" viewBox="0 0 180 100" fill="none"><path d="M8 75Q35 10 70 43T162 10M148 12l14-2-3 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          <div className="border-t-2 border-[#89d5e3] bg-[#a8e0ec] px-4 py-4 text-center text-[12px] font-black uppercase tracking-[.15em] text-[#193745] sm:text-sm">
            Learn by doing <span className="mx-3 text-[#e84837]">✳</span> Ask better questions <span className="mx-3 text-[#e84837]">✳</span> Design for people <span className="mx-3 text-[#e84837]">✳</span> Keep iterating
          </div>
        </section>

        <section id="how" className="scroll-mt-32 px-5 py-20 sm:px-9 lg:py-28 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <SectionTitle eyebrow="01 / THE WAY WE LEARN" title="Một hành trình. Không có lối đi cố định." desc="Năm chế độ tư duy có thể di chuyển qua lại. Bạn bắt đầu từ câu hỏi, hành động nhỏ, rồi quay lại cải tiến khi có thêm minh chứng."/>
              <Link href="/demo" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#203d45] px-5 text-sm font-extrabold hover:bg-white">Khám phá học thử <ArrowUpRight size={17}/></Link>
            </div>
            <NonLinearModes />
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-white p-5 text-sm font-semibold text-[#415962] sm:p-6">
              <span><MousePointer2 className="mr-2 inline text-[#ed513c]" size={19}/> Con trỏ hành trình dẫn đường — bạn có thể quay lại bất kỳ chế độ nào.</span>
              <span className="shrink-0 rounded-full bg-[#e9f5df] px-3 py-1.5 text-xs font-black text-[#276045]">NON-LINEAR</span>
            </div>
          </div>
        </section>

        <section id="courses" className="scroll-mt-32 bg-white px-5 py-20 sm:px-9 lg:py-28 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow="02 / YOUR LEARNING LIBRARY" title="Khóa học để bạn thử điều mới." desc="Bộ sưu tập nội dung mẫu giúp bạn hình dung cách học trong UII. Không yêu cầu đăng nhập để khám phá và làm bài tập demo."/>
              <DemoFlag/>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {DEMO_COURSES.map((course,index)=><Link key={course.id} href={"/demo?course="+course.id} className="group overflow-hidden rounded-[25px] border border-[#e5e7e1] bg-[#faf9f5] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(14,44,57,.13)]">
                <div className="relative">
                  <DemoPhoto src={course.photo} alt={"Hình ảnh minh họa học tập: "+course.title} tint={course.accent} className="aspect-[16/10] w-full"/>
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-2 text-[11px] font-extrabold text-[#1f3b43]">{course.level}</span>
                  <span className="absolute right-4 top-4 rounded-full bg-[#182e3d]/90 px-3 py-2 text-[11px] font-bold text-white">DEMO</span>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest text-[#954020]"><span>COURSE {String(index+1).padStart(2,"0")}</span><span>{course.duration}</span></div>
                  <h3 className="text-2xl font-black leading-tight tracking-tight">{course.title}</h3>
                  <p className="min-h-16 text-sm leading-7 text-[#4d6268]">{course.summary}</p>
                  <div className="flex flex-wrap gap-2">{course.skills.slice(0,2).map(skill=><span key={skill} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#405960]">{skill}</span>)}</div>
                  <div className="flex items-center justify-between border-t border-[#e8e8e1] pt-4 text-sm font-extrabold"><span>{course.chapters.length} bài · {DEMO_EXERCISES.filter(x=>x.courseId===course.id).length} bài tập</span><ArrowUpRight size={19} className="text-[#d34a31] transition group-hover:translate-x-1 group-hover:-translate-y-1"/></div>
                </div>
              </Link>)}
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-32 bg-[#f8e7dc] px-5 py-20 sm:px-9 lg:py-24 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <div className="grid items-center gap-10 lg:grid-cols-[.95fr_1.05fr]">
              <div>
                <SectionTitle eyebrow="03 / WORKSHOP TOOLBOX" title="Đừng chỉ đọc. Hãy cầm bút và thử." desc="Interview Guide, Crazy 8s, POV Builder, Feedback Canvas… Những công cụ nhỏ được thiết kế để biến kiến thức thành hành động."/>
                <Link href="/demo#tools" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#173445] px-6 text-sm font-black text-white">Thử công cụ demo <ArrowRight size={17}/></Link>
              </div>
              <div className="relative">
                <DemoPhoto src={DEMO_PHOTOS.stickyNotes} alt="Bảng ghi chú nhiều màu sử dụng để tổng hợp và trao đổi ý tưởng" tint="#f9d9a0" className="aspect-[5/3] w-full rounded-[30px] shadow-[0_20px_50px_rgba(46,39,24,.15)]"/>
                <span className="absolute -bottom-5 right-4 rotate-[-5deg] rounded-lg bg-[#d9ef8e] px-5 py-4 text-xl font-black shadow-lg sm:right-10">Keep asking why!</span>
              </div>
            </div>
            <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {DEMO_TOOLS.map((tool,i)=><Link href={"/demo?tool="+encodeURIComponent(tool.name)+"#tools"} key={tool.name} className="group flex min-h-[190px] flex-col rounded-[22px] border border-[#e9cdbb] bg-white/85 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-lg">
                <div className="flex items-start justify-between"><span className="text-xs font-black text-[#8e341e]">{String(i+1).padStart(2,"0")} / {tool.kind}</span><ArrowUpRight size={17} className="transition group-hover:translate-x-1 group-hover:-translate-y-1"/></div>
                <h3 className="mt-5 text-lg font-black">{tool.name}</h3>
                <p className="mt-2 flex-1 text-xs leading-6 text-[#54616b]">{tool.intro}</p>
                <p className="mt-4 border-t border-[#e5d7ce] pt-3 text-[11px] font-extrabold text-[#aa4928]">{tool.mode} · {tool.minutes} phút</p>
              </Link>)}
            </div>
          </div>
        </section>

        <section id="projects" className="scroll-mt-32 bg-[#c5e6dd] px-5 py-20 sm:px-9 lg:py-28 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionTitle eyebrow="04 / FROM IDEAS TO IMPACT" title="Những vấn đề đáng để cùng giải." desc="Tám tình huống dự án giả định minh họa cách sinh viên có thể bắt đầu từ nhu cầu cộng đồng và phát triển giải pháp. Đây không phải dự án thật của người học."/>
              <DemoFlag/>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {DEMO_PROJECTS.map((project,i)=><article key={project.title} className="group overflow-hidden rounded-[24px] bg-white shadow-[0_7px_24px_rgba(25,74,62,.07)]">
                <DemoPhoto src={project.photo} alt={"Ảnh minh họa tình huống dự án "+project.title} tint={["#f8dfa4","#d0e9f7","#e0e9b1","#ffdacd"][i%4]} className="aspect-[5/3.3] w-full"/>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-widest text-[#c04c2b]">{project.theme}</span><span className="rounded-full bg-[#e9f3e9] px-2 py-1 text-[10px] font-extrabold text-[#2b7254]">{project.mode}</span></div>
                  <h3 className="text-xl font-black leading-snug">{project.title}</h3>
                  <p className="min-h-[72px] text-xs leading-6 text-[#50626a]">{project.summary}</p>
                  <p className="border-t border-[#e8ecea] pt-3 text-xs font-bold text-[#2c5962]"><Users className="mr-1 inline" size={14}/>{project.team}</p>
                </div>
              </article>)}
            </div>
          </div>
        </section>

        <section id="practice" className="bg-[#173345] px-5 py-20 text-white sm:px-9 xl:px-14">
          <div className="mx-auto grid max-w-[1390px] items-center gap-9 lg:grid-cols-[1fr_auto]">
            <div><Eyebrow>05 / TRY IT NOW</Eyebrow><h2 className="mt-4 max-w-[860px] text-[clamp(2.1rem,4.5vw,4.7rem)] font-black leading-[1.08] tracking-[-.05em]">Làm một bài tập nhỏ. <span className="text-[#ffc27b]">Khám phá một góc nhìn mới.</span></h2><p className="mt-5 max-w-[620px] text-sm leading-7 text-[#d6e4e9]">Chọn một quiz, thử viết phản tư hoặc hình dung một nguyên mẫu. Bản demo hoạt động ngay trên trình duyệt, không tính điểm LMS hay ghi thông tin vào tài khoản.</p></div>
            <Link href="/demo" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#f5c96c] px-8 text-sm font-black text-[#173345] transition hover:-translate-y-1 hover:bg-[#ffdf94]">Bắt đầu bài tập demo <Play fill="currentColor" size={17}/></Link>
          </div>
        </section>

        <section id="stories" className="scroll-mt-32 px-5 py-20 sm:px-9 lg:py-24 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <SectionTitle eyebrow="06 / THE LEARNING MINDSET" title="Học tốt hơn khi biết lắng nghe." desc="Ba tình huống phản hồi minh họa các góc nhìn về hành trình học. Các trích dẫn này được viết cho giao diện demo, không phải lời chứng thực có thật."/>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {DEMO_QUOTES.map((quote,i)=><blockquote key={quote.role} className="flex min-h-[235px] flex-col justify-between rounded-[26px] p-7" style={{backgroundColor:["#e1e8fb","#ffe5ce","#d9edc3"][i]}}>
                <span aria-hidden="true" className="text-6xl font-black leading-none text-[#e8583b]">“</span>
                <p className="my-3 text-[18px] font-extrabold leading-relaxed tracking-tight">{quote.quote}</p>
                <footer className="mt-3 border-t border-black/10 pt-4 text-xs font-bold text-[#506369]">{quote.role} · DEMO</footer>
              </blockquote>)}
            </div>
          </div>
        </section>

        <section id="events" className="scroll-mt-32 bg-white px-5 py-20 sm:px-9 lg:py-24 xl:px-14">
          <div className="mx-auto max-w-[1390px]">
            <div className="flex flex-wrap items-end justify-between gap-6"><SectionTitle eyebrow="07 / LET'S LEARN TOGETHER" title="Workshop là nơi ý tưởng gặp người thật." desc="Lịch dưới đây là mockup để thử giao diện tổ chức hoạt động. Những chương trình và ngày tháng được minh họa, chưa mở đăng ký."/ ><DemoFlag/></div>
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {DEMO_EVENTS.map((event,i)=><article key={event.title} className="rounded-[23px] border border-[#e2e8e2] bg-[#faf9f5] p-6">
                <div className="flex items-center justify-between"><CalendarDays size={22} className="text-[#d14c2c]"/><span className="rounded-full bg-[#ffecd9] px-3 py-1.5 text-[10px] font-black text-[#a34926]">CHƯA MỞ ĐĂNG KÝ</span></div>
                <p className="mt-7 text-xs font-black uppercase tracking-widest text-[#c04d2c]">{event.date}</p>
                <h3 className="mt-3 text-xl font-black">{event.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#586b6b]">{event.description}</p>
                <p className="mt-6 border-t border-[#e4e5de] pt-4 text-xs font-semibold text-[#506369]"><MapPin size={14} className="mr-1 inline"/>{event.format}</p>
              </article>)}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#f2bb6a] px-5 py-20 sm:px-9 lg:py-24 xl:px-14">
          <div className="pointer-events-none absolute -right-8 -top-24 h-80 w-80 rounded-full border-[55px] border-white/35" aria-hidden="true"/>
          <div className="relative mx-auto max-w-[1390px]">
            <Eyebrow dark>READY FOR YOUR FIRST IDEA?</Eyebrow>
            <h2 className="mt-4 max-w-[900px] font-[family-name:var(--font-sans-ui)] text-[clamp(2.8rem,6.3vw,6.3rem)] font-black leading-[1] tracking-[-0.065em]">Let&apos;s make something <span className="text-[#bd352b]">matter.</span></h2>
            <p className="mt-6 max-w-[680px] text-lg font-semibold">Bắt đầu nhỏ. Học cùng nhau. Thử và cải tiến mỗi ngày.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#173445] px-7 text-sm font-black text-white">Thử ngay bài học <ArrowRight size={18}/></Link>
              <Link href="/learn" className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#173445] bg-white px-7 text-sm font-black">Vào Learning Hub <ChevronRight size={18}/></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#132b3b] px-5 py-10 text-white sm:px-9 xl:px-14">
        <div className="mx-auto flex max-w-[1390px] flex-wrap items-start justify-between gap-6">
          <div><p className="text-xl font-black">UII <span className="text-[#e96a4a]">✳</span> Design Thinking Hub</p><p className="mt-3 max-w-lg text-xs leading-6 text-[#c4d1d6]">UII đang trong giai đoạn xây dựng, thử nghiệm. Khóa học, dự án, hình thức đánh giá và sự kiện trên landing page được minh họa riêng, không tự động tạo trong hệ thống LMS.</p></div>
          <div className="flex flex-wrap gap-5 text-xs font-bold"><Link href="/learn">Đăng nhập</Link><Link href="/demo">Bài tập Demo</Link><Link href="/dashboard">Dashboard</Link><a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Ảnh: Unsplash / tác giả gốc</a><a href="https://unsplash.com/photos/people-in-a-design-meeting-in-an-office-boardroom-pzFzd1AD8Ow" target="_blank" rel="noreferrer">Hình nhóm: Mapbox (Unsplash)</a></div>
        </div>
      </footer>
    </div>
  );
}
