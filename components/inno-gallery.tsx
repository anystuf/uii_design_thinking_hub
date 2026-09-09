"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquareText, Star } from "lucide-react";
import { galleryProjects, stageSlides } from "@/lib/hub-data";

function GalleryFeed() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-2 xl:columns-3">
      {galleryProjects.map((project, index) => (
        <article
          key={project.title}
          className="mb-4 break-inside-avoid overflow-hidden rounded-[1.35rem] border border-uii-border bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-uii-orange"
          data-sketch="true"
        >
          <div className={`relative border-b border-uii-border ${index % 2 === 0 ? "aspect-[4/3]" : "aspect-[3/4]"} bg-notebook bg-[length:28px_28px]`}>
            <div className="absolute inset-4 rounded-[1rem] border border-uii-border bg-white/50" />
            <div className="absolute left-4 top-4 rounded-full border border-uii-border bg-white px-3 py-1 font-sansUi text-[10px] font-extrabold uppercase tracking-[0.16em] text-uii-blue shadow-soft">
              {project.phase}
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full border border-uii-border bg-white px-2.5 py-1 font-sansUi text-sm font-black text-uii-text shadow-soft">
              <Star className="h-3.5 w-3.5 fill-uii-orange text-uii-orange" /> {project.rating}
            </div>
          </div>
          <div className="p-5">
            <h3 className="font-sansUi text-lg font-black tracking-[-0.04em] text-uii-text">{project.title}</h3>
            <p className="mt-1 text-sm font-medium text-uii-muted">{project.author}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-uii-border px-2.5 py-1 font-sansUi text-xs font-extrabold text-uii-muted">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function NumberLine({ label, value }: { label: string; value: number }) {
  const marks = useMemo(() => Array.from({ length: 10 }, (_, index) => index + 1), []);

  return (
    <div className="border-b border-uii-border py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-sansUi text-sm font-black text-uii-text">{label}</span>
        <span className="font-sansUi text-2xl font-black text-uii-orange">{value}</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {marks.map((mark) => (
          <button
            key={mark}
            className={`h-8 rounded-lg border font-sansUi text-xs font-extrabold transition ${mark <= value ? "border-uii-blue bg-uii-blue text-white" : "border-uii-border bg-white text-uii-muted hover:border-uii-orange"}`}
            data-sketch="true"
            aria-label={`${label} rating ${mark}`}
          >
            {mark}
          </button>
        ))}
      </div>
    </div>
  );
}

function CritiquePanel() {
  return (
    <aside className="overflow-hidden rounded-[1.35rem] border border-uii-border bg-white shadow-soft">
      <div className="border-b border-uii-border p-5">
        <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-orange">Critique Panel</p>
        <h3 className="mt-2 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">Structured review scorecard</h3>
      </div>
      <div className="px-5">
        <NumberLine label="Desirability" value={9} />
        <NumberLine label="Feasibility" value={8} />
        <NumberLine label="Viability" value={7} />
      </div>
      <div className="border-t border-uii-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-sansUi font-black text-uii-text">Comment feed</h4>
          <MessageSquareText className="h-4 w-4 text-uii-muted" />
        </div>
        <div className="grid gap-3 text-sm leading-6">
          <div className="rounded-2xl border border-uii-border bg-uii-bg p-3 text-uii-muted">
            <strong className="text-uii-text">Lecturer Mai:</strong> Excellent evidence trace. Add one more constraint around operational cost.
          </div>
          <div className="rounded-2xl border border-uii-border bg-white p-3 text-uii-muted">
            <strong className="text-uii-text">Peer Khoa:</strong> The prototype feels clear. I want to see a stronger test scenario for first-time users.
          </div>
        </div>
        <textarea
          className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-uii-border bg-white p-3 text-sm outline-none transition placeholder:text-uii-muted/60 focus:border-uii-orange"
          placeholder="Write critique with evidence, not vibes..."
        />
        <button className="mt-3 w-full rounded-full bg-uii-orange px-4 py-3 font-sansUi text-sm font-extrabold text-white transition hover:bg-uii-orange2" data-sketch="true">
          Submit critique
        </button>
      </div>
    </aside>
  );
}

function ProjectStage() {
  const [active, setActive] = useState(0);
  const slide = stageSlides[active];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-[1.35rem] border border-uii-border bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-uii-border px-5 py-4">
          <div>
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.2em] text-uii-orange">Project Stage</p>
            <h3 className="mt-1 font-sansUi text-xl font-black tracking-[-0.04em] text-uii-text">AgriSense Field Companion</h3>
          </div>
          <div className="flex gap-2">
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-uii-border bg-white transition hover:border-uii-orange"
              onClick={() => setActive((active - 1 + stageSlides.length) % stageSlides.length)}
              data-sketch="true"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-uii-border bg-white transition hover:border-uii-orange"
              onClick={() => setActive((active + 1) % stageSlides.length)}
              data-sketch="true"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden border-b border-uii-border bg-uii-bg bg-notebook bg-[length:32px_32px]">
          <div className="absolute inset-8 rounded-[1.25rem] border border-uii-border bg-white/50" />
          <div className="absolute left-8 top-8 rounded-full border border-uii-border bg-white px-3 py-1 font-sansUi text-xs font-extrabold uppercase tracking-[0.16em] text-uii-blue shadow-soft">
            {slide.phase}
          </div>
          <div className="absolute bottom-8 left-8 max-w-xl">
            <h4 className="font-serifDisplay text-5xl font-bold leading-none tracking-[-0.05em] text-uii-text">
              {slide.title}
            </h4>
            <p className="mt-4 max-w-lg text-sm leading-6 text-uii-muted">{slide.caption}</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar">
          {stageSlides.map((item, index) => (
            <button
              key={item.phase}
              onClick={() => setActive(index)}
              className={`min-w-36 rounded-full border px-4 py-3 text-left font-sansUi text-xs font-extrabold uppercase tracking-[0.14em] transition ${active === index ? "border-uii-blue bg-uii-blue text-white" : "border-uii-border bg-white text-uii-muted hover:border-uii-orange"}`}
              data-sketch="true"
            >
              {item.phase}
            </button>
          ))}
        </div>
      </div>
      <CritiquePanel />
    </div>
  );
}

export function InnoGallery() {
  return (
    <section id="gallery" className="px-5 pb-10 lg:px-7">
      <div className="rounded-[1.6rem] border border-uii-border bg-white p-5 shadow-soft lg:p-7">
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.22em] text-uii-orange">Native InnoGallery</p>
            <h2 className="mt-2 max-w-4xl font-serifDisplay text-5xl font-bold leading-[0.95] tracking-[-0.05em] text-uii-text md:text-6xl">
              A portfolio stage where critique is structured, visible, and reusable.
            </h2>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded-full border border-uii-border bg-white px-5 py-3 font-sansUi text-sm font-extrabold text-uii-blue transition hover:border-uii-orange hover:text-uii-orange" data-sketch="true">
            Browse all projects <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-8 2xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <GalleryFeed />
          </div>
          <ProjectStage />
        </div>
      </div>
    </section>
  );
}
