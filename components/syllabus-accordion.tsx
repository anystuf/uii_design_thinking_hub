"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { syllabus } from "@/lib/hub-data";

export function SyllabusAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-uii-border bg-white">
      {syllabus.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.week} className="border-b border-uii-border last:border-b-0">
            <button
              className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition hover:bg-uii-bg"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              data-sketch="true"
            >
              <div className="flex items-start gap-5">
                <span className="font-serifDisplay text-4xl font-bold leading-none text-uii-blue/20">{item.week}</span>
                <span>
                  <span className="block font-sansUi text-[11px] font-extrabold uppercase tracking-[0.18em] text-uii-orange">{item.phase}</span>
                  <span className="mt-1 block font-sansUi text-lg font-black tracking-[-0.03em] text-uii-text">{item.title}</span>
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 text-uii-muted transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen ? (
              <div className="px-5 pb-6 pl-[5.75rem]">
                <ul className="grid gap-3 border-l border-uii-border pl-5 text-sm leading-6 text-uii-muted">
                  {item.objectives.map((objective) => (
                    <li key={objective} className="relative before:absolute before:-left-[1.55rem] before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-uii-orange">
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
