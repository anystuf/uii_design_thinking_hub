"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; at: number };
const LIFE_MS = 1150;
const MAX_POINTS = 76;

/**
 * A playful red hand-drawn cursor line, inspired by creative sketching.
 * Purely decorative: never intercepts clicks, never replaces the native
 * cursor, and is disabled automatically for touch/reduced-motion/Focus Mode.
 */
export function CreativePointerTrail({ enabled }: { enabled: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) svg.style.opacity = "0";
    if (!enabled || !window.matchMedia("(pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const points: Point[] = [];
    const syncViewport = () => svgRef.current?.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);
    syncViewport();

    const paint = (now: number) => {
      while (points.length && now - points[0].at > LIFE_MS) points.shift();
      if (!points.length) {
        svgRef.current?.style.setProperty("opacity", "0");
        pathRef.current?.setAttribute("d", "");
        frame = 0;
        return;
      }
      const first = points[0];
      let path = "M " + first.x + " " + first.y;
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const prev = points[i - 1];
        const midX = (prev.x + p.x) / 2;
        const midY = (prev.y + p.y) / 2;
        path += " Q " + prev.x + " " + prev.y + " " + midX + " " + midY;
      }
      const last = points[points.length - 1];
      path += " L " + last.x + " " + last.y;
      pathRef.current?.setAttribute("d", path);
      dotRef.current?.setAttribute("cx", String(last.x));
      dotRef.current?.setAttribute("cy", String(last.y));
      svgRef.current?.style.setProperty("opacity", "1");
      frame = requestAnimationFrame(paint);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.clientX < 0 || event.clientY < 0 ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !window.matchMedia("(pointer: fine)").matches) return;
      const last = points[points.length - 1];
      if (last && Math.hypot(last.x - event.clientX, last.y - event.clientY) < 3) return;
      points.push({ x: event.clientX, y: event.clientY, at: performance.now() });
      if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      points.length = 0;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      svgRef.current?.style.setProperty("opacity", "0");
      pathRef.current?.setAttribute("d", "");
    };
    const onPreferencesChanged = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !window.matchMedia("(pointer: fine)").matches) onLeave();
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", syncViewport, { passive: true });
    window.addEventListener("blur", onLeave);
    reducedMotion.addEventListener("change", onPreferencesChanged);
    finePointer.addEventListener("change", onPreferencesChanged);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("blur", onLeave);
      reducedMotion.removeEventListener("change", onPreferencesChanged);
      finePointer.removeEventListener("change", onPreferencesChanged);
      onLeave();
    };
  }, [enabled]);

  return <svg ref={svgRef} data-testid="creative-pointer-trail"
    data-enabled={enabled ? "true" : "false"}
    aria-hidden="true" focusable="false"
    className="pointer-events-none fixed inset-0 z-[60] h-[100dvh] w-screen select-none"
    style={{ opacity: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
    {/* A viewport-coordinate drawing must use CSS pixels, not scaled viewBox units.
        Set a matching SVG viewBox at runtime on resize below. */}
    <path ref={pathRef} fill="none" stroke="#f0352b" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    <circle ref={dotRef} cx="-100" cy="-100" r="6" fill="#f0352b" />
  </svg>;
}
