import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Play,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { ActiveLearningDashboard } from "./active-learning-dashboard";
import { CourseCatalog } from "./course-catalog";
import { CourseOverview } from "./course-overview";
import { InnoGallery } from "./inno-gallery";
import {
  courseProgressRows,
  dashboardMetrics,
  learningJourney,
  sidebarLinks,
  sprintPhases,
  studioInsights,
  supportNeeds,
  topNavLinks,
  upcomingWorkshops,
} from "@/lib/hub-data";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#dashboard" className="flex items-center gap-3" data-sketch="true">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-uii-orange text-sm font-black text-white shadow-soft">
        UII
      </span>
      <span>
        <span className={`block font-sansUi text-sm font-extrabold tracking-tight ${compact ? "text-uii-text" : "text-white"}`}>UII Hub</span>
        <span className={`block text-[10px] font-semibold tracking-wide ${compact ? "text-uii-muted" : "text-white/60"}`}>Design Thinking Platform</span>
      </span>
    </a>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-[radial-gradient(circle_at_0%_0%,rgba(243,112,33,0.18),transparent_18rem),linear-gradient(180deg,#102A5F_0%,#071B42_64%,#061633_100%)] px-4 py-6 lg:block">
      <BrandMark />
      <nav className="mt-9 grid gap-1.5">
        {sidebarLinks.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <a
              key={item.href}
              href={item.href}
              data-sketch="true"
              className={`group flex items-center gap-3 rounded-[1.15rem] px-3.5 py-3 font-sansUi text-sm font-extrabold transition ${
                active
                  ? "bg-uii-orange text-white shadow-[0_16px_34px_rgba(243,112,33,0.26)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <div className="absolute bottom-5 left-4 right-4 rounded-[1.4rem] border border-white/10 bg-white/10 p-4 text-white/70 backdrop-blur">
        <p className="font-sansUi text-xs font-extrabold uppercase tracking-[0.18em] text-white/50">Studio Mode</p>
        <p className="mt-2 text-sm leading-6">Human evidence first. AI assists. Lecturers decide.</p>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-uii-border/80 bg-uii-bg/90 backdrop-blur-xl">
      <div className="flex min-h-[5.5rem] items-center gap-4 px-5 py-4 lg:px-7">
        <div className="lg:hidden">
          <BrandMark compact />
        </div>
        <div className="hidden lg:block">
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.22em] text-uii-orange">UEH Innovation Platform</p>
          <h1 className="mt-1 font-sansUi text-3xl font-black tracking-[-0.04em] text-uii-text">Design Thinking Hub</h1>
        </div>
        <nav className="ml-4 hidden items-center gap-1 xl:flex">
          {topNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="marker-hover rounded-full px-4 py-2 font-sansUi text-sm font-extrabold text-uii-muted transition hover:text-uii-text"
              data-sketch="true"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-full border border-uii-border bg-white px-4 py-3 shadow-soft md:flex">
          <Search className="h-4 w-4 text-uii-muted" />
          <input className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-uii-muted/70" placeholder="Search courses, projects, toolkits..." />
        </div>
        <button className="hidden items-center gap-2 rounded-full border border-uii-border bg-white px-4 py-3 font-sansUi text-xs font-extrabold text-uii-text shadow-soft transition hover:border-uii-blue md:inline-flex" data-sketch="true">
          View as: Student <ChevronDown className="h-4 w-4" />
        </button>
        <button className="relative grid h-12 w-12 place-items-center rounded-full border border-uii-border bg-white text-uii-text shadow-soft transition hover:border-uii-orange" data-sketch="true" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-uii-orange text-[10px] font-black text-white">3</span>
        </button>
        <button className="hidden rounded-full border border-uii-border bg-white px-4 py-3 font-sansUi text-xs font-extrabold text-uii-text shadow-soft transition hover:border-uii-blue sm:block" data-sketch="true">
          Approvals
        </button>
        <button className="grid h-12 w-12 place-items-center rounded-full bg-uii-orange text-white shadow-soft transition hover:bg-uii-orange2" data-sketch="true" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function MetricCard({ metric }: { metric: (typeof dashboardMetrics)[number] }) {
  const Icon = metric.icon;
  return (
    <article className="relative overflow-hidden rounded-[1.4rem] border border-uii-border bg-white p-5 shadow-soft" data-sketch="true">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-uii-orange/10" />
      <div className="flex items-center justify-between">
        <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">{metric.label}</p>
        <Icon className="h-4 w-4 text-uii-orange" />
      </div>
      <div className="mt-2 font-sansUi text-4xl font-black tracking-[-0.06em] text-uii-blue">{metric.value}</div>
      <p className="mt-2 text-xs font-medium text-uii-muted">{metric.note}</p>
    </article>
  );
}

function DonutChart({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-5">
      <div
        className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(#F37021 ${value * 3.6}deg, #173F8A ${value * 3.6}deg 315deg, #E8ECF2 315deg 360deg)` }}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white font-sansUi text-2xl font-black text-uii-blue">
          {value}
        </div>
      </div>
      <div className="grid gap-2 text-xs font-semibold text-uii-muted">
        <span className="flex items-center gap-2"><CircleDot className="h-3.5 w-3.5 fill-uii-orange text-uii-orange" /> {label}</span>
        <span className="flex items-center gap-2"><CircleDot className="h-3.5 w-3.5 fill-uii-blue text-uii-blue" /> Instructor reviewed</span>
        <span className="flex items-center gap-2"><CircleDot className="h-3.5 w-3.5 fill-uii-border text-uii-border" /> Needs follow-up</span>
      </div>
    </div>
  );
}

function BarRow({ label, value, count, color = "bg-uii-orange" }: { label: string; value: number; count?: number; color?: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr_1.5rem] items-center gap-3 text-xs">
      <span className="truncate font-semibold text-uii-muted">{label}</span>
      <span className="h-2 rounded-full bg-slate-100">
        <span className={`block h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </span>
      <span className="text-right font-sansUi font-black text-uii-text">{count ?? Math.round(value / 10)}</span>
    </div>
  );
}

function AnalyticsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-[1.4rem] border border-uii-border bg-white p-5 shadow-soft" data-sketch="true">
      <h3 className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-orange">{title}</h3>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function DashboardHero() {
  return (
    <section id="dashboard" className="px-5 pb-8 pt-5 lg:px-7 lg:pt-7">
      <div className="rounded-[1.6rem] bg-[radial-gradient(circle_at_90%_0%,rgba(243,112,33,0.24),transparent_24rem),linear-gradient(135deg,#173F8A_0%,#071B42_55%,#061633_100%)] p-7 text-white shadow-card lg:p-9">
        <p className="font-sansUi text-xs font-extrabold uppercase tracking-[0.22em] text-white/70">UII Design Thinking Learning Hub</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="max-w-4xl font-serifDisplay text-5xl font-bold leading-[0.9] tracking-[-0.055em] md:text-7xl">
              Learn. Prototype. <span className="sketch-underline relative">Showcase.</span>
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
              A premium studio-style mini-LMS where students learn design thinking, submit sprint evidence, receive structured critique, and publish portfolio-ready innovation projects.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["Current Sprint", "Define"],
              ["Next Action", "Upload HMW"],
              ["Studio Health", "66/100"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.1rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="font-sansUi text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50">{label}</p>
                <p className="mt-2 font-sansUi text-xl font-black tracking-tight text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#workspace" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-sansUi text-sm font-extrabold text-uii-blue transition hover:bg-uii-cream" data-sketch="true">
            Continue Sprint <Play className="h-4 w-4 fill-current" />
          </a>
          <a href="#gallery" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-sansUi text-sm font-extrabold text-white transition hover:bg-white/10" data-sketch="true">
            Explore InnoGallery <Sparkles className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function MetricsGrid() {
  return (
    <section className="grid gap-4 px-5 pb-8 lg:grid-cols-3 lg:px-7 xl:grid-cols-3">
      {dashboardMetrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}

function ExecutiveAnalytics() {
  return (
    <section id="studio" className="px-5 pb-8 lg:px-7">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-muted">Executive Analytics</p>
          <h2 className="font-sansUi text-2xl font-black tracking-[-0.04em] text-uii-text">Visual learning studio report</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-uii-muted">Charts translate course work, sprint submissions, critique activity, and portfolio readiness into a single academic studio view.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        <AnalyticsCard title="Sprint Completion">
          <DonutChart value={68} label="Student progress" />
        </AnalyticsCard>
        <AnalyticsCard title="Design Journey">
          <div className="grid gap-3">
            {sprintPhases.map((phase) => (
              <BarRow key={phase.name} label={phase.name} value={phase.value} count={phase.count} color={phase.color} />
            ))}
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Resource Status">
          <DonutChart value={86} label="Toolkit ready" />
        </AnalyticsCard>
        <AnalyticsCard title="Task Status">
          <div className="grid gap-3">
            <BarRow label="In progress" value={42} count={12} color="bg-uii-blue" />
            <BarRow label="Next" value={68} count={21} color="bg-uii-orange" />
            <BarRow label="Planned" value={55} count={17} color="bg-uii-success" />
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Cohort Bands">
          <div className="h-4 overflow-hidden rounded-full bg-slate-100">
            <div className="inline-block h-4 bg-uii-danger" style={{ width: "12%" }} />
            <div className="inline-block h-4 bg-uii-orange" style={{ width: "68%" }} />
            <div className="inline-block h-4 bg-uii-success" style={{ width: "20%" }} />
          </div>
          <div className="mt-5 grid gap-2">
            {learningJourney.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs font-semibold text-uii-muted">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} /> {item.label}</span>
                <span className="font-sansUi font-black text-uii-text">{item.value}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Top Studio Needs">
          <div className="grid gap-3">
            {supportNeeds.map((need, index) => (
              <BarRow key={need.label} label={need.label} value={90 - index * 10} count={need.value} color={index % 2 === 0 ? "bg-uii-blue" : "bg-uii-orange"} />
            ))}
          </div>
        </AnalyticsCard>
        <AnalyticsCard title="Workshop Pipeline">
          <div className="grid gap-3">
            {upcomingWorkshops.slice(0, 3).map((workshop) => {
              const Icon = workshop.icon;
              return (
                <div key={workshop.title} className="flex items-center justify-between rounded-2xl border border-uii-border bg-uii-bg px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-bold text-uii-text"><Icon className="h-3.5 w-3.5 text-uii-orange" /> {workshop.title}</span>
                  <span className="font-sansUi text-[11px] font-extrabold text-uii-muted">{workshop.date}</span>
                </div>
              );
            })}
          </div>
        </AnalyticsCard>
      </div>
    </section>
  );
}

function ProgressAndInsights() {
  return (
    <section className="grid gap-4 px-5 pb-10 lg:grid-cols-[1.35fr_0.8fr] lg:px-7">
      <article className="rounded-[1.4rem] border border-uii-border bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-muted">Learning Journey</p>
            <h2 className="font-sansUi text-2xl font-black tracking-[-0.04em] text-uii-text">Teams needing support first</h2>
          </div>
          <span className="rounded-full border border-uii-border px-3 py-1.5 font-sansUi text-xs font-extrabold text-uii-blue">Average progress 66%</span>
        </div>
        <div className="grid gap-3">
          {courseProgressRows.map((row) => {
            const riskClass = row.status === "Needs review" ? "bg-red-50 text-uii-danger" : row.status === "Portfolio-ready" ? "bg-emerald-50 text-uii-success" : "bg-orange-50 text-uii-orange";
            return (
              <div key={row.name} className="rounded-[1.2rem] border border-uii-border bg-white p-4" data-sketch="true">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-sansUi text-sm font-black text-uii-text">{row.name}</h3>
                    <p className="mt-1 text-xs font-medium text-uii-muted">{row.project}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 font-sansUi text-[11px] font-extrabold ${riskClass}`}>{row.status}</span>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-uii-orange" style={{ width: `${row.progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </article>
      <article id="ai-mentor" className="rounded-[1.4rem] border border-uii-border bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-muted">AI Mentor Preview</p>
            <h2 className="font-sansUi text-2xl font-black tracking-[-0.04em] text-uii-text">Studio insights</h2>
          </div>
          <BrainCircuitBadge />
        </div>
        <div className="grid gap-3">
          {studioInsights.map((insight) => (
            <div key={insight.title} className="rounded-[1.2rem] border border-uii-border bg-white p-4" data-sketch="true">
              <h3 className="font-sansUi text-sm font-black text-uii-text">{insight.title}</h3>
              <p className="mt-2 text-xs leading-5 text-uii-muted">{insight.body}</p>
              {insight.next ? <p className="mt-3 text-xs leading-5 text-uii-text"><strong>Next:</strong> {insight.next.replace(/^Next:\s*/, "")}</p> : null}
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function BrainCircuitBadge() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-uii-cream text-uii-orange">
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

function StudioQuickActions() {
  return (
    <section id="assignments" className="grid gap-4 px-5 pb-8 lg:grid-cols-4 lg:px-7">
      {[
        ["Current Sprint", "Define the challenge", "Upload HMW statement", "68%"],
        ["Peer Feedback", "12 new comments", "Review critique feed", "Live"],
        ["Toolkit", "Prototype test plan", "Download template", "PDF"],
        ["Portfolio", "5 projects published", "Polish case study", "Ready"],
      ].map(([label, title, action, value]) => (
        <article key={label} className="rounded-[1.4rem] border border-uii-border bg-white p-5 shadow-soft" data-sketch="true">
          <div className="flex items-center justify-between">
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-orange">{label}</p>
            <CheckCircle2 className="h-4 w-4 text-uii-success" />
          </div>
          <h3 className="mt-3 font-sansUi text-lg font-black tracking-[-0.03em] text-uii-text">{title}</h3>
          <p className="mt-2 text-sm text-uii-muted">{action}</p>
          <div className="mt-5 font-sansUi text-3xl font-black tracking-[-0.05em] text-uii-blue">{value}</div>
        </article>
      ))}
    </section>
  );
}

export function UiiLearningHub() {
  return (
    <div className="min-h-screen bg-uii-bg text-uii-text">
      <Sidebar />
      <main className="lg:ml-64">
        <Topbar />
        <DashboardHero />
        <MetricsGrid />
        <ExecutiveAnalytics />
        <ProgressAndInsights />
        <StudioQuickActions />
        <CourseCatalog />
        <CourseOverview />
        <InnoGallery />
        <div id="workspace">
          <ActiveLearningDashboard />
        </div>
        <footer className="px-5 pb-8 pt-2 text-center text-xs font-semibold text-uii-muted lg:px-7">
          UII Design Thinking Learning Hub · Light mode academic studio system · Built with Next.js, Tailwind CSS, and TypeScript.
        </footer>
      </main>
    </div>
  );
}
