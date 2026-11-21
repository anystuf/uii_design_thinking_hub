"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbulb, Shapes, Sparkles } from "lucide-react";

/** Photo with a self-contained fallback when an external photo CDN is blocked. */
export function DemoPhoto({
  src, alt, sizes = "(max-width: 640px) 100vw, 50vw", priority = false,
  className = "", tint = "#c6ebff",
}: {
  src: string; alt: string; sizes?: string; priority?: boolean;
  className?: string; tint?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={"relative isolate overflow-hidden bg-[#d9eafd] " + className}
      style={{ backgroundColor: tint }}
      data-testid="demo-photo"
    >
      {failed ? (
        <div role="img" aria-label={alt + " — hình minh họa thay thế"} className="absolute inset-0 grid place-items-center">
          <div className="absolute left-[8%] top-[12%] h-[45%] w-[40%] rotate-[-12deg] rounded-xl bg-[#fdf0ad] shadow-lg" />
          <div className="absolute right-[11%] top-[22%] h-[44%] w-[33%] rotate-[10deg] rounded-xl bg-[#ff9b78] shadow-lg" />
          <div className="absolute bottom-[10%] left-[26%] h-[38%] w-[42%] rotate-[5deg] rounded-xl bg-white/80 shadow-lg" />
          <div className="relative z-10 flex gap-2 text-[#173762]"><Shapes size={35}/><Lightbulb size={35}/><Sparkles size={35}/></div>
        </div>
      ) : (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized priority={priority}
          onError={() => setFailed(true)}
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061b33]/15 via-transparent to-transparent"/>
    </div>
  );
}
