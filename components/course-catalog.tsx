import { ArrowRight } from "lucide-react";
import { courses, resourceBlocks } from "@/lib/hub-data";
import { CourseCard } from "./course-card";

export function CourseCatalog() {
  return (
    <section id="catalog" className="px-5 pb-10 lg:px-7">
      <div className="rounded-[1.6rem] border border-uii-border bg-white p-5 shadow-soft lg:p-7">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-sansUi text-[11px] font-extrabold uppercase tracking-[0.22em] text-uii-orange">Academic Course Catalog</p>
            <h2 className="mt-2 max-w-4xl font-serifDisplay text-5xl font-bold leading-[0.95] tracking-[-0.05em] text-uii-text md:text-6xl">
              Choose a sprint path, then publish evidence into InnoGallery.
            </h2>
          </div>
          <a
            href="#overview"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-uii-border bg-white px-5 py-3 font-sansUi text-sm font-extrabold text-uii-blue transition hover:border-uii-orange hover:text-uii-orange"
            data-sketch="true"
          >
            View foundation course <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          {resourceBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <article key={block.title} className="rounded-[1.2rem] border border-uii-border bg-uii-bg p-4" data-sketch="true">
                <div className="mb-5 flex items-center justify-between">
                  <Icon className="h-5 w-5 text-uii-orange" />
                  <span className="rounded-full bg-white px-2.5 py-1 font-sansUi text-[10px] font-extrabold uppercase tracking-[0.12em] text-uii-muted">{block.eyebrow}</span>
                </div>
                <h3 className="font-sansUi text-base font-black tracking-[-0.03em] text-uii-text">{block.title}</h3>
                <p className="mt-2 text-sm leading-6 text-uii-muted">{block.body}</p>
              </article>
            );
          })}
        </div>

        <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} featured={index === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
