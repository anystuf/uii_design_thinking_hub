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
        "group z-10 block min-h-[172px] rounded-[27px] border border-[#213b3b]/10 p-5 text-[#132a35] " +
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

/** The ribbon and its arrows share the same cubic Bézier geometry. */
type Point = readonly [number, number];
type Cubic = { start: Point; c1: Point; c2: Point; end: Point };

const RIBBON_CURVES: readonly Cubic[] = [
  { start: [188, 259], c1: [188, 95], c2: [360, 70], end: [539, 258] },
  { start: [539, 258], c1: [691, 414], c2: [712, 417], end: [855, 258] },
  { start: [855, 258], c1: [1035, 72], c2: [1202, 93], end: [1202, 259] },
  { start: [1202, 259], c1: [1202, 432], c2: [1035, 456], end: [855, 258] },
  { start: [855, 258], c1: [705, 91], c2: [683, 105], end: [539, 258] },
  { start: [539, 258], c1: [361, 448], c2: [188, 432], end: [188, 259] },
];

const ribbonPath = [
  "M188 259",
  ...RIBBON_CURVES.map(({ c1, c2, end }) => "C" + c1.join(" ") + " " + c2.join(" ") + " " + end.join(" ")),
].join(" ");

function ribbonSample(segment: number, t: number) {
  const { start, c1, c2, end } = RIBBON_CURVES[segment];
  const u = 1 - t;
  const coordinate = (axis: number) =>
    u ** 3 * start[axis] + 3 * u ** 2 * t * c1[axis] +
    3 * u * t ** 2 * c2[axis] + t ** 3 * end[axis];
  const derivative = (axis: number) =>
    3 * u ** 2 * (c1[axis] - start[axis]) +
    6 * u * t * (c2[axis] - c1[axis]) +
    3 * t ** 2 * (end[axis] - c2[axis]);

  return {
    x: coordinate(0),
    y: coordinate(1),
    angle: Math.atan2(derivative(1), derivative(0)) * 180 / Math.PI,
  };
}

/** A chevron is anchored on the centerline, aligned with the path tangent. */
function RibbonDirection({ segment, t }: { segment: number; t: number }) {
  const { x, y, angle } = ribbonSample(segment, t);
  return (
    <g
      data-testid="uii-ribbon-arrow"
      data-segment={segment}
      data-curve-t={t}
      transform={"translate(" + x.toFixed(3) + " " + y.toFixed(3) + ") rotate(" + angle.toFixed(3) + ")"}
    >
      <path d="M-11 -11 L1 0 L-11 11" stroke="#fff" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
}

/** Contrasting iteration icon in the open center of the infinity shape. */
function IterationSymbol({ cx, cy, compact = false }: { cx: number; cy: number; compact?: boolean }) {
  const scale = compact ? 1.18 : 1.65;
  return (
    <g data-testid="uii-infinity-center">
      <circle
        cx={cx} cy={cy} r={compact ? 25 : 38}
        fill="#faf8f1" fillOpacity=".99"
        stroke="#718e9a" strokeWidth={compact ? 2 : 2.8}
      />
      <g transform={"translate(" + (cx - 12 * scale) + " " + (cy - 12 * scale) + ") scale(" + scale + ")"}>
        <path
          d="M20 11a8.1 8.1 0 0 0-15.5-2 M4 4v5h5 M4 13a8.1 8.1 0 0 0 15.5 2 M20 20v-5h-5"
          stroke="#345868" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" fill="none"
        />
      </g>
    </g>
  );
}

/** Decorative graphic; the five learning modes remain keyboard-accessible links. */
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
        <IterationSymbol cx={300} cy={105} compact />
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
      <path d={ribbonPath} stroke="#cbd7d0" strokeWidth="79" strokeLinecap="round"
        strokeLinejoin="round" opacity=".21" />
      <path data-testid="uii-infinity-ribbon-path" d={ribbonPath}
        stroke="url(#uii-infinity-ribbon)" strokeWidth="69"
        strokeLinecap="round" strokeLinejoin="round" />
      <RibbonDirection segment={0} t={0.22} />
      <RibbonDirection segment={5} t={0.19} />
      <RibbonDirection segment={2} t={0.26} />
      <RibbonDirection segment={3} t={0.75} />
      <IterationSymbol cx={695} cy={259} />
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
          <p className="mt-2 text-sm italic text-[#4c6269]">A non-linear process</p>
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
          <p className="mt-2 text-xs italic text-[#4c6269]">Bạn có thể bắt đầu ở bất kỳ chế độ nào.</p>
          <InfinityRibbon compact />
        </div>
        <div className="-mt-1 grid gap-4 sm:grid-cols-2">
          {modes.map((mode) => <ModeCard key={mode.number} mode={mode} />)}
        </div>
      </div>
    </div>
  );
}
