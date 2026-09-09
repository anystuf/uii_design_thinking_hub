import { Clock3, SignalHigh } from "lucide-react";
import type { Course } from "@/lib/hub-data";

export function CourseCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  const Icon = course.icon;

  return (
    <article
      data-sketch="true"
      className={`group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-uii-border bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-uii-orange ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <div className={`relative aspect-video border-b border-uii-border ${course.accent} bg-notebook bg-[length:28px_28px]`}>
        <div className="absolute inset-4 rounded-[1rem] border border-white/70 bg-white/50" />
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-uii-border bg-white/90 px-3 py-1 font-sansUi text-[10px] font-extrabold uppercase tracking-[0.16em] text-uii-text backdrop-blur">
          <Icon className="h-3.5 w-3.5 text-uii-orange" />
          {course.tag}
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
          <span className="max-w-[70%] truncate font-serifDisplay text-5xl font-bold leading-none text-uii-blue/10">{course.phase}</span>
          <span className="rounded-full border border-uii-border bg-white px-3 py-1 font-sansUi text-xs font-extrabold text-uii-blue shadow-soft">
            {course.price}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">{course.title}</h3>
            <p className="mt-1 text-sm font-medium text-uii-muted">{course.mentor}</p>
          </div>
          <span className="shrink-0 rounded-full border border-uii-border px-2.5 py-1 font-sansUi text-[11px] font-extrabold text-uii-text">
            {course.level}
          </span>
        </div>

        <p className="mb-5 text-sm leading-6 text-uii-muted">{course.description}</p>

        {typeof course.progress === "number" ? (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-uii-muted">
              <span>Studio progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-uii-orange" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-uii-border pt-4 font-sansUi text-xs font-extrabold text-uii-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-uii-border px-3 py-1">
            <Clock3 className="h-3.5 w-3.5 text-uii-orange" /> {course.duration}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-uii-border px-3 py-1">
            <SignalHigh className="h-3.5 w-3.5 text-uii-blue" /> {course.level}
          </span>
        </div>
      </div>
    </article>
  );
}
