import Link from 'next/link';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ChevronRight,
  Compass, FlaskConical, GraduationCap, Handshake, Layers3, Lightbulb,
  MoveUpRight, Network, PlayCircle, RefreshCcw, Rocket, ShieldCheck,
  Sparkles, Target, Users, Workflow,
} from 'lucide-react';

const pillars = [
  {
    id: '01', name: 'Training & Education', vi: 'Đào tạo & Phát triển năng lực',
    description: 'Học Design Thinking qua thử thách thực tế, phát triển tư duy sáng tạo và năng lực giải quyết vấn đề.',
    points: ['Khóa học và bài học', 'Challenge-Based Learning', 'Theo dõi tiến độ và phản hồi'],
    href: '/dashboard', link: 'Khám phá Learning Hub',
    icon: GraduationCap, tint: 'bg-[#eaf1ff] text-[#2862ad]', status: 'MVP đang thử nghiệm', ready: true,
  },
  {
    id: '02', name: 'Innovation Lab', vi: 'Phòng thí nghiệm đổi mới sáng tạo',
    description: 'Nơi các nhóm cùng khám phá vấn đề, xây dựng nguyên mẫu, kiểm chứng giả định và cải tiến giải pháp.',
    points: ['Năm chế độ Design Thinking', 'Cộng tác theo dự án', 'Evidence và lịch sử phiên bản'],
    href: '/studio', link: 'Mở Design Studio',
    icon: FlaskConical, tint: 'bg-[#eeebff] text-[#6a4ab6]', status: 'MVP đang thử nghiệm', ready: true,
  },
  {
    id: '03', name: 'Incubation Program', vi: 'Ươm tạo & Phát triển dự án',
    description: 'Định hướng hỗ trợ ý tưởng tiềm năng tiến từ khám phá vấn đề đến kiểm chứng thị trường và tăng trưởng.',
    points: ['Problem–Solution Fit', 'Product–Customer Fit', 'Go-to-Market & Growth'],
    href: '#roadmap', link: 'Xem lộ trình phát triển',
    icon: Rocket, tint: 'bg-[#fff0e5] text-[#d55c1b]', status: 'Định hướng tiếp theo', ready: false,
  },
  {
    id: '04', name: 'Work with UII', vi: 'Kết nối & Hợp tác đổi mới sáng tạo',
    description: 'Cầu nối giữa người học, nhà giáo dục, chuyên gia, doanh nghiệp và đối tác tạo tác động cho cộng đồng.',
    points: ['Hợp tác học thuật', 'Bài toán từ doanh nghiệp', 'Đồng hành cùng hệ sinh thái'],
    href: '#connect', link: 'Tìm hiểu cơ hội hợp tác',
    icon: Handshake, tint: 'bg-[#e8f7f0] text-[#198963]', status: 'Định hướng tiếp theo', ready: false,
  },
];

const stages = [
  { label: 'Empathize', vi: 'Thấu hiểu con người và bối cảnh', icon: Users },
  { label: 'Define', vi: 'Xác định vấn đề trọng tâm', icon: Target },
  { label: 'Ideate', vi: 'Phát triển các ý tưởng', icon: Lightbulb },
  { label: 'Prototype', vi: 'Hiện thực hóa giải pháp', icon: Layers3 },
  { label: 'Test', vi: 'Kiểm chứng với người dùng', icon: FlaskConical },
];

const releases = [
  { code: 'A', title: 'Learning Foundation', subtitle: 'Xác thực, khóa học, bài học, ghi danh, tiến độ', items: 'F01–F04' },
  { code: 'B', title: 'Design Studio', subtitle: 'Challenge, đội nhóm, năm chế độ, hoạt động thực hành', items: 'F05–F08' },
  { code: 'C', title: 'Evidence & Versioning', subtitle: 'Minh chứng riêng tư, lịch sử thay đổi, bài nộp bất biến', items: 'F09 · F11–F12' },
  { code: 'D', title: 'Assessment & Feedback', subtitle: 'Rubric, đánh giá phiên bản, phản hồi và thông báo', items: 'F13–F14 · F16' },
];

function Brand({ light = false }: { light?: boolean }) {
  return <span className="inline-flex items-center gap-3">
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#b94708] text-[13px] font-black tracking-tight text-white shadow-[0_8px_20px_rgba(243,112,33,0.2)]">UII</span>
    <span className={'text-left text-sm font-extrabold leading-[1.2] tracking-tight ' + (light ? 'text-white' : 'text-[#09234c]')}>
      UII Design Thinking <span className="block">Hub</span>
    </span>
  </span>;
}

export function UIIPublicLanding() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#0a254e]">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 xl:px-12">
          <Link href="/" aria-label="UII Design Thinking Hub — Trang chủ"><Brand/></Link>
          <nav aria-label="Điều hướng trang công khai" className="hidden items-center gap-7 lg:flex">
            <a href="#pillars" className="text-[13px] font-bold text-slate-600 transition hover:text-[#f37021]">Hệ sinh thái</a>
            <a href="#how-it-works" className="text-[13px] font-bold text-slate-600 transition hover:text-[#f37021]">Hành trình đổi mới</a>
            <a href="#roadmap" className="text-[13px] font-bold text-slate-600 transition hover:text-[#f37021]">MVP & Roadmap</a>
            <a href="#connect" className="text-[13px] font-bold text-slate-600 transition hover:text-[#f37021]">Hợp tác</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/learn" className="hidden rounded-xl px-4 py-3 text-xs font-extrabold text-[#102f61] hover:bg-slate-100 sm:inline-flex">Đăng nhập</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#102f61] px-4 py-3 text-xs font-extrabold text-white shadow-[0_6px_17px_rgba(12,40,87,0.15)] transition hover:bg-[#1c4884] sm:px-5">Vào Learning Hub <ArrowRight size={16}/></Link>
          </div>
        </div>
        <nav aria-label="Điều hướng nhanh" className="flex items-center gap-6 overflow-x-auto border-t border-slate-100 px-5 py-2.5 text-xs font-bold text-slate-600 lg:hidden sm:px-8">
          <a className="shrink-0" href="#pillars">4 trụ cột</a><a className="shrink-0" href="#how-it-works">Hành trình</a><a className="shrink-0" href="#roadmap">MVP</a><a className="shrink-0" href="#connect">Hợp tác</a>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#071d43] text-white">
          <div className="pointer-events-none absolute -right-36 -top-64 h-[620px] w-[620px] rounded-full border-[90px] border-[#f37021]/10" aria-hidden="true"/>
          <div className="pointer-events-none absolute bottom-[-310px] left-[30%] h-[530px] w-[530px] rounded-full bg-[#254e92]/30 blur-[110px]" aria-hidden="true"/>
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.03fr_0.97fr] xl:px-12 xl:py-28">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.08] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#ffc299]">
                <Sparkles size={15}/> Learning · Innovation · Impact
              </div>
              <h1 className="mt-8 max-w-[740px] font-[family-name:var(--font-sans-ui)] text-[clamp(2.55rem,5.5vw,5rem)] font-extrabold leading-[1.1] tracking-[-0.055em]">
                From ideas to <span className="relative whitespace-nowrap text-[#ff9854]">impact<span className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-[#ff9854]/40"/></span>.
              </h1>
              <p className="mt-7 max-w-xl text-lg font-semibold leading-relaxed text-white/90 sm:text-[21px]">Nơi tri thức gặp thử nghiệm. Nơi ý tưởng được kiểm chứng bằng hành động.</p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#b8c9e2] sm:text-base">UII Design Thinking Hub kết nối học tập theo dự án, thực hành tư duy thiết kế và hành trình đổi mới sáng tạo — từ hiểu đúng vấn đề đến tạo giá trị cho cộng đồng.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#b94708] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(243,112,33,0.23)] transition hover:-translate-y-0.5 hover:bg-[#963b08]">Khám phá Learning Hub <ArrowRight size={18}/></Link>
                <a href="#pillars" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/20">Tìm hiểu hệ sinh thái <ArrowDownRight size={17}/></a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-300">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#ff9854]"/> MVP học tập đã triển khai staging</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-[#ff9854]"/> Truy cập theo vai trò</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[590px]" aria-label="Minh họa hành trình đổi mới: khám phá, thiết kế, thử nghiệm và cải tiến">
              <div className="relative rounded-[32px] border border-white/15 bg-[#102b58]/80 p-5 shadow-[0_34px_100px_rgba(0,0,0,.23)] backdrop-blur-sm sm:p-7">
                <div className="mb-7 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#ffb387]">The innovation journey</p><h2 className="mt-1 text-xl font-extrabold">Think. Make. Learn.</h2></div>
                  <span className="rounded-full border border-[#82d8b3]/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black text-[#a8f1cd]">ITERATIVE</span>
                </div>
                <div className="relative grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.09] p-5">
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b94708]/25 text-[#ffb783]"><Compass size={22}/></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">01 · Discover</p>
                    <p className="mt-1 text-[16px] font-extrabold">Hiểu vấn đề</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.09] p-5">
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7b91e9]/25 text-[#c5d0ff]"><Lightbulb size={22}/></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">02 · Imagine</p>
                    <p className="mt-1 text-[16px] font-extrabold">Tạo ý tưởng</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.09] p-5">
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5cc1a1]/20 text-[#a5ead5]"><Layers3 size={22}/></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">03 · Prototype</p>
                    <p className="mt-1 text-[16px] font-extrabold">Tạo giải pháp</p>
                  </div>
                  <div className="rounded-[22px] border border-[#f37021]/45 bg-[#b94708]/15 p-5">
                    <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b94708] text-white"><Target size={22}/></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffc299]">04 · Validate</p>
                    <p className="mt-1 text-[16px] font-extrabold">Đo & cải tiến</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-center text-xs font-bold text-slate-300"><RefreshCcw size={16} className="text-[#ff9854]"/> Every iteration creates new learning.</div>
              </div>
              <div className="pointer-events-none absolute -left-4 -top-4 h-20 w-20 rounded-full bg-[#b94708]/20 blur-2xl" aria-hidden="true"/>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-5 px-5 py-7 sm:grid-cols-3 sm:px-8 xl:px-12">
            <div className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#174784]"><BookOpen size={22}/></span><div><p className="text-sm font-extrabold">Learn by doing</p><p className="text-xs text-slate-500">Học qua thử thách thực tế</p></div></div>
            <div className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ad4007]"><Workflow size={22}/></span><div><p className="text-sm font-extrabold">Evidence-driven</p><p className="text-xs text-slate-500">Quyết định dựa trên minh chứng</p></div></div>
            <div className="flex items-center gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Network size={22}/></span><div><p className="text-sm font-extrabold">Connected impact</p><p className="text-xs text-slate-500">Kết nối con người và cơ hội</p></div></div>
          </div>
        </section>

        <section id="pillars" className="scroll-mt-28 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-24 xl:px-12">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ad4007]">THE UII ECOSYSTEM</p>
              <h2 className="mt-3 font-[family-name:var(--font-sans-ui)] text-3xl font-extrabold tracking-tight sm:text-4xl">Bốn trụ cột. Một hành trình đổi mới.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Từ nền tảng học tập đang thử nghiệm đến hệ sinh thái hỗ trợ dự án và kết nối nguồn lực. Mỗi trụ cột có một vai trò rõ ràng.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"><span className="h-2 w-2 rounded-full bg-[#b94708]"/> Roadmap minh bạch</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {pillars.map(({id, name, vi, description, points, href, link, icon:Icon, tint, status, ready}) => (
              <article key={id} className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_8px_34px_rgba(7,29,67,0.045)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(7,29,67,0.1)] sm:p-8">
                <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-8 text-[140px] font-black leading-none text-slate-50">{id}</span>
                <div className="relative flex flex-wrap items-start justify-between gap-3">
                  <span className={'flex h-14 w-14 items-center justify-center rounded-2xl '+tint}><Icon size={27}/></span>
                  <span className={'rounded-full px-3 py-1.5 text-[10px] font-extrabold '+(ready?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600')}>{status}</span>
                </div>
                <div className="relative mt-7">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ad4007]">{id} / {name}</p>
                  <h3 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">{vi}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">{description}</p>
                  <div className="mt-5 grid gap-2">{points.map(point=><p key={point} className="flex items-start gap-2 text-[13px] font-semibold text-slate-600"><CheckCircle2 size={16} className={'mt-0.5 shrink-0 '+(ready?'text-emerald-600':'text-slate-600')}/>{point}</p>)}</div>
                  <Link href={href} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#123d77] transition group-hover:text-[#eb6a24]">{link} <ArrowUpRight size={17}/></Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-28 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 xl:px-12">
            <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ad4007]">THE LEARNING JOURNEY</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Không chỉ học lý thuyết. <span className="text-[#e76b24]">Học bằng trải nghiệm.</span></h2><p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Design Thinking là một quá trình linh hoạt. Người học có thể quay lại bất kỳ chế độ nào khi xuất hiện minh chứng mới — không phải một chuỗi cổng bắt buộc.</p></div>
            <div className="mt-10 grid gap-3 md:grid-cols-5">
              {stages.map(({label,vi,icon:Icon},i)=>(
                <div key={label} className="relative rounded-2xl border border-slate-200 bg-[#f8fafd] px-5 py-6">
                  <span className="text-[10px] font-black tracking-[0.16em] text-slate-600">{String(i+1).padStart(2,'0')}</span>
                  <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8eef9] text-[#1b518d]"><Icon size={22}/></div>
                  <p className="mt-5 text-base font-extrabold">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{vi}</p>
                  {i<4 && <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden text-[#e76b24] md:block" size={20}/>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-[#f8fafd] p-4 text-center text-sm font-semibold text-slate-600"><RefreshCcw size={18} className="shrink-0 text-[#ad4007]"/> Quay lại, thử nghiệm và cải tiến khi có thêm dữ liệu.</div>
          </div>
        </section>

        <section id="roadmap" className="scroll-mt-28 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-24 xl:px-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ad4007]">WHAT’S AVAILABLE TODAY</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">MVP thực tế. Từng bước kiểm chứng.</h2><p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Bốn nhóm chức năng Learning Hub đã được triển khai trên staging. Chúng tôi đang kiểm thử hành trình người dùng và chất lượng dữ liệu trước khi đưa vào vận hành chính thức.</p></div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#102f61] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#1c4884]">Trải nghiệm MVP <ArrowRight size={17}/></Link>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {releases.map(({code,title,subtitle,items})=><div key={code} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_28px_rgba(7,29,67,0.035)]">
              <div className="flex items-center justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e315e] text-lg font-black text-white">{code}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">UAT đang thực hiện</span></div>
              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-widest text-[#ad4007]">{items}</p>
              <h3 className="mt-1 text-lg font-extrabold">{title}</h3><p className="mt-3 text-xs leading-6 text-slate-600">{subtitle}</p>
            </div>)}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-[13px] leading-6 text-[#7f461d]"><ShieldCheck className="mt-0.5 shrink-0" size={18}/><p><strong>Staging ≠ production-ready.</strong> Chức năng đã được triển khai không có nghĩa toàn bộ kiểm thử bảo mật, lưu trữ và nghiệp vụ đã hoàn tất. Các chương trình Incubation và Partnership là định hướng mở rộng sau giai đoạn MVP.</p></div>
        </section>

        <section className="bg-[#071d43] py-20 text-white">
          <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] xl:px-12">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffae76]">OUR WAY OF WORKING</p><h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Build. Measure.<br/>Learn. <span className="text-[#ff9854]">Improve.</span></h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">Mỗi phiên bản của UII Design Thinking Hub là một giả thuyết cần kiểm chứng. Chúng tôi tạo trải nghiệm, đo lường kết quả, lắng nghe người dùng và tiếp tục cải tiến.</p></div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {id:'01',title:'Build',vi:'Xây dựng giải pháp có thể sử dụng'},
                {id:'02',title:'Measure',vi:'Đo hành vi và kết quả thực tế'},
                {id:'03',title:'Learn',vi:'Hiểu điều gì hiệu quả, điều gì chưa'},
                {id:'04',title:'Improve',vi:'Ưu tiên cải tiến và thử lại'},
              ].map(x=><div key={x.id} className="rounded-[22px] border border-white/15 bg-white/[0.08] p-5 sm:p-6"><p className="text-[11px] font-black tracking-[0.16em] text-[#ffae76]">{x.id}</p><h3 className="mt-4 text-lg font-extrabold">{x.title}</h3><p className="mt-2 text-xs leading-6 text-slate-300">{x.vi}</p></div>)}
            </div>
          </div>
        </section>

        <section id="connect" className="scroll-mt-28 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-24 xl:px-12">
          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#e9f0fc] via-white to-[#fff0e6] px-7 py-11 sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute -right-14 -top-36 h-96 w-96 rounded-full border-[48px] border-[#f37021]/10" aria-hidden="true"/>
            <div className="relative flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#e1661d]">LET’S SHAPE WHAT’S NEXT</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Cùng biến ý tưởng thành tác động.</h2><p className="mt-4 text-sm leading-7 text-slate-600">Bạn là sinh viên, giảng viên hay người quan tâm đến đổi mới sáng tạo? Hãy bắt đầu với Learning Hub. Các kênh hợp tác và ươm tạo sẽ được phát triển trong các giai đoạn tiếp theo.</p></div>
              <div className="flex flex-wrap gap-3"><Link href="/learn" className="inline-flex items-center gap-2 rounded-xl bg-[#b94708] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#963b08]">Tham gia Learning Hub <ArrowRight size={17}/></Link><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-[#102f61] transition hover:bg-slate-50">Đi tới Dashboard <MoveUpRight size={16}/></Link></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 px-5 py-9 sm:px-8 xl:px-12">
          <div><Brand/><p className="mt-3 text-xs text-slate-500">Evidence-centered learning · Project-based innovation · Continuous improvement.</p></div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-bold text-slate-500"><a href="#pillars" className="hover:text-[#ad4007]">Hệ sinh thái</a><a href="#roadmap" className="hover:text-[#ad4007]">MVP Roadmap</a><Link href="/dashboard" className="hover:text-[#ad4007]">Learning Dashboard <ArrowUpRight size={13} className="inline"/></Link></div>
          <p className="w-full text-[11px] text-slate-600">UII Design Thinking Hub · Staging Preview — Không phải môi trường vận hành chính thức.</p>
        </div>
      </footer>
    </div>
  );
}
