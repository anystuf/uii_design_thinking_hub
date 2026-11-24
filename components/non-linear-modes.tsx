import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Compass,
  HeartHandshake,
  Lightbulb,
  Shapes,
  Zap,
} from "lucide-react";

const modes = [
  { name: "Empathize", vi: "Lắng nghe con người", bg: "#fee0c6", number: "01", icon: HeartHandshake, phrase: "Listen closely.", query: "empathy" },
  { name: "Define", vi: "Tìm đúng vấn đề", bg: "#f4c8d8", number: "02", icon: Compass, phrase: "Frame the real need.", query: "framing" },
  { name: "Ideate", vi: "Mở rộng khả năng", bg: "#e4e3fb", number: "03", icon: Lightbulb, phrase: "Make ideas visible.", query: "ideation" },
  { name: "Prototype", vi: "Biến ý tưởng thành mẫu", bg: "#d3ee8c", number: "04", icon: Shapes, phrase: "Make to learn.", query: "prototyping" },
  { name: "Test", vi: "Thử, học và cải tiến", bg: "#c9edfa", number: "05", icon: Zap, phrase: "Learn from reality.", query: "iteration" },
] as const;

type Mode = (typeof modes)[number];

function ModeCard({ mode, className = "" }: { mode: Mode; className?: string }) {
  const Icon = mode.icon;

  return (
    <Link
      href={"/demo?course=" + mode.query}
      className={
        "group relative z-10 block min-h-[172px] rounded-[27px] border border-[#213b3b]/10 p-5 text-[#132a35] " +
        "shadow-[0_16px_38px_rgba(16,47,57,.09)] transition duration-300 " +
        "hover:-translate-y-1.5 hover:shadow-[0_24px_45px_rgba(16,47,57,.16)] " +
        "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#173445] " +
        className
      }
      style={{ backgroundColor: mode.bg }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-black tracking-[.035em]">MODE / {mode.number}</span>
        <ArrowUpRight size={19} aria-hidden="true" className="shrink-0 text-[#294751]/70 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <div className="mt-4 flex items-center gap-3.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-[#1b3640]/20 bg-white/55">
          <Icon size={26} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[22px] font-black leading-tight tracking-[-.035em]">{mode.name}</h3>
          <p className="mt-1 text-[12px] font-bold leading-5">{mode.vi}</p>
          <p className="mt-2 text-[12px] italic leading-5 text-[#34464e]">{mode.phrase}</p>
        </div>
      </div>
    </Link>
  );
}

/** The ribbon is decorative: each mode is an ordinary keyboard-accessible link. */
function InfinityRibbon({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <svg aria-hidden="true" className="mx-auto h-auto w-full max-w-[500px]" viewBox="0 0 600 210" fill="none">
        <defs>
          <linearGradient id="uii-infinity-compact" x1="40" y1="35" x2="560" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffce9f" />
            <stop offset=".25" stopColor="#f6abc8" />
            <stop offset=".49" stopColor="#b9b4f7" />
            <stop offset=".73" stopColor="#c7ec85" />
            <stop offset="1" stopColor="#97d9f8" />
          </linearGradient>
        </defs>
        <path
          d="M68 105 C68 18 165 18 255 105 S435 192 528 105 C528 18 435 18 345 105 S165 192 68 105"
          stroke="url(#uii-infinity-compact)" strokeWidth="29" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="m130 59 13 10 -5 17 M453 149 l-13 -10 5 -17" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="300" cy="105" r="24" fill="#faf8f1" fillOpacity=".85" />
        <path d="M289 101a12 12 0 0 1 20-5m0 0v-8m0 8h-8M311 109a12 12 0 0 1-20 5m0 0v8m0-8h8" stroke="#59727e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      data-testid="uii-infinity-journey"
      className="pointer-events-none absolute left-0 top-[91px] h-[510px] w-full"
      viewBox="0 0 1390 520"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
    >
      <defs>
        <linearGradient id="uii-infinity-ribbon" x1="118" y1="80" x2="1260" y2="465" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffce9f" />
          <stop offset=".22" stopColor="#f5a5cd" />
          <stop offset=".48" stopColor="#bcb3f7" />
          <stop offset=".73" stopColor="#c7ec85" />
          <stop offset="1" stopColor="#96d9fa" />
        </linearGradient>
      </defs>
      <path
        d="M188 259 C188 95 360 70 539 258 C691 414 712 417 855 258 C1035 72 1202 93 1202 259 C1202 432 1035 456 855 258 C705 91 683 105 539 258 C361 448 188 432 188 259"
        stroke="#cbd7d0" strokeWidth="79" strokeLinecap="round" opacity=".21"
      />
      <path
        d="M188 259 C188 95 360 70 539 258 C691 414 712 417 855 258 C1035 72 1202 93 1202 259 C1202 432 1035 456 855 258 C705 91 683 105 539 258 C361 448 188 432 188 259"
        stroke="url(#uii-infinity-ribbon)" strokeWidth="69" strokeLinecap="round" strokeLinejoin="round"
      />
      <g stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".94">
        <path d="m226 149 14 11 -3 19 m-20 -27 14 11 -3 19" />
        <path d="m445 406 -14 -12 8 -18 m-18 32 -14 -12 8 -18" />
        <path d="m978 134 15 9 -2 20 m-20 -25 15 9 -2 20" />
        <path d="m1155 335 -12 15 -18 -7 m28 7 -12 15 -18 -7" />
        <path d="m898 409 -16 -9 3 -18 m-23 20 -16 -9 3 -18" />
      </g>
      <circle cx="695" cy="259" r="37" fill="white" fillOpacity=".18" />
      <path
        d="M677 251a21 21 0 0 1 35-6m0 0v-13m0 13h-13M713 268a21 21 0 0 1-35 6m0 0v13m0-13h13"
        stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function NonLinearModes() {
  const positions = [
    "left-[12%] top-6",
    "left-[1%] top-[348px]",
    "left-1/2 top-[440px] -translate-x-1/2 hover:-translate-y-1.5",
    "right-[10%] top-6",
    "right-[1%] top-[348px]",
  ] as const;

  return (
    <div aria-label="Năm chế độ tư duy phi tuyến tính">
      <div className="relative hidden h-[641px] w-full xl:block">
        <InfinityRibbon />
        <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 text-center">
          <span className="inline-flex whitespace-nowrap rounded-full bg-[#dcefd7] px-5 py-2.5 text-[13px] font-black text-[#245a43] shadow-sm">
            QUY TRÌNH PHI TUYẾN TÍNH
          </span>
          <p className="mt-2 text-sm italic text-[#63777d]">A non-linear process</p>
          <ArrowLeftRight aria-hidden="true" className="mx-auto mt-2 text-[#889ba0]" size={24} />
        </div>
        {modes.map((mode, index) => (
          <ModeCard key={mode.number} mode={mode} className={"absolute w-[285px] " + positions[index]} />
        ))}
      </div>

      <div className="xl:hidden">
        <div className="mx-auto max-w-[520px] text-center">
          <span className="inline-flex rounded-full bg-[#dcefd7] px-4 py-2 text-xs font-black text-[#245a43]">
            QUY TRÌNH PHI TUYẾN TÍNH
          </span>
          <p className="mt-2 text-xs italic text-[#63777d]">Bạn có thể bắt đầu ở bất kỳ chế độ nào.</p>
          <InfinityRibbon compact />
        </div>
        <div className="-mt-1 grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => <ModeCard key={mode.number} mode={mode} />)}
        </div>
      </div>
    </div>
  );
}
