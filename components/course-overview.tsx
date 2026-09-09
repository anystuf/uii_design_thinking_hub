import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SyllabusAccordion } from "./syllabus-accordion";

export function CourseOverview() {
  return (
    <section id="overview" className="px-5 pb-10 lg:px-7">
      <div className="grid gap-6 rounded-[1.6rem] border border-uii-border bg-white p-5 shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:p-7">
        <div className="rounded-[1.35rem] bg-[radial-gradient(circle_at_100%_0%,rgba(243,112,33,0.16),transparent_18rem),linear-gradient(135deg,#173F8A,#071B42)] p-6 text-white lg:sticky lg:top-28 lg:self-start">
          <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">Course Overview</p>
          <h2 className="mt-4 font-serifDisplay text-5xl font-bold leading-[0.92] tracking-[-0.05em] md:text-6xl">
            Design Thinking Foundations
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/75">
            A high-signal pre-enrollment page for students who need to understand outcomes, workload, critique expectations, and portfolio outputs before joining a cohort.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-white/80">
            {["Live critique rituals", "Portfolio-ready sprint evidence", "Lecturer-reviewed final project"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-uii-orange" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-sansUi text-sm font-extrabold text-uii-blue transition hover:bg-uii-cream" data-sketch="true">
              Enroll Now <ArrowRight className="h-4 w-4" />
            </button>
            <button className="rounded-full border border-white/20 px-6 py-3 font-sansUi text-sm font-extrabold text-white transition hover:bg-white/10" data-sketch="true">
              Download syllabus
            </button>
          </div>
        </div>

        <div>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            {[
              ["Cohort", "Aug 2026"],
              ["Workload", "4–6 hrs / week"],
              ["Output", "Sprint portfolio"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.2rem] border border-uii-border bg-uii-bg p-5" data-sketch="true">
                <div className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-muted">{label}</div>
                <div className="mt-2 font-sansUi text-xl font-black tracking-tight text-uii-text">{value}</div>
              </div>
            ))}
          </div>
          <SyllabusAccordion />
        </div>
      </div>
    </section>
  );
}
