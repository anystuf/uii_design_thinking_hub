"use client";

import { useEffect, useRef } from "react";

type CursorPoint = { x: number; y: number; at: number };

const TRAIL_LIFETIME_MS = 2800;
const MAX_POINTS = 110;

/**
 * A decorative, Stanford d.school-style hand-drawn red trace for mouse and
 * trackpad users. Rendered ONCE in RootLayout, never behind a clipped course
 * section. It is enabled by default, has no toggle, and never captures input.
 *
 * Device respect: touch does not draw, prefers-reduced-motion disables motion,
 * and UII's Focus Mode temporarily suppresses the entire effect.
 */
export function CreativePointerTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const points: CursorPoint[] = [];
    let frame = 0;
    let viewportWidth = 1;
    let viewportHeight = 1;

    const isDisabled = () =>
      prefersReducedMotion.matches ||
      document.documentElement.dataset.uiiFocusMode === "true" ||
      document.visibilityState === "hidden";

    const clear = () => {
      points.length = 0;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      canvas.setAttribute("data-active", "false");
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.max(1, Math.round(viewportWidth * ratio));
      canvas.height = Math.max(1, Math.round(viewportHeight * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      clear();
    };

    const render = (now: number) => {
      frame = 0;
      if (isDisabled()) {
        clear();
        return;
      }

      while (points.length && now - points[0].at > TRAIL_LIFETIME_MS)
        points.shift();

      context.clearRect(0, 0, viewportWidth, viewportHeight);
      if (!points.length) {
        canvas.setAttribute("data-active", "false");
        return;
      }

      const latest = points[points.length - 1];
      const fade = Math.min(1, (TRAIL_LIFETIME_MS - (now - latest.at)) / 700);
      context.globalAlpha = Math.max(0, fade);
      context.strokeStyle = "#f0362b";
      context.lineWidth = 3.5;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const before = points[i - 1];
        const current = points[i];
        context.quadraticCurveTo(
          before.x, before.y,
          (before.x + current.x) / 2,
          (before.y + current.y) / 2,
        );
      }
      context.lineTo(latest.x, latest.y);
      context.stroke();

      // A bright red endpoint is visible even before a longer stroke forms.
      context.fillStyle = "#f0362b";
      context.beginPath();
      context.arc(latest.x, latest.y, 6, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      canvas.setAttribute("data-active", "true");
      frame = requestAnimationFrame(render);
    };

    const record = (x: number, y: number) => {
      if (isDisabled()) {
        clear();
        return;
      }
      if (x < 0 || y < 0 || x > viewportWidth || y > viewportHeight) return;
      const latest = points[points.length - 1];
      if (latest && Math.hypot(latest.x - x, latest.y - y) < 2) return;
      points.push({ x, y, at: performance.now() });
      if (points.length > MAX_POINTS)
        points.splice(0, points.length - MAX_POINTS);
      if (!frame) frame = requestAnimationFrame(render);
    };

    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen")
        record(event.clientX, event.clientY);
    };
    // Trackpads, hybrid laptops, and some browsers fire mousemove but do not
    // report (pointer:fine). Do not gate on that media query.
    const mouseMove = (event: MouseEvent) => record(event.clientX, event.clientY);
    const visibilityChange = () => { if (isDisabled()) clear(); };

    resize();
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("mousemove", mouseMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", clear);
    window.addEventListener("uii:focus-mode-changed", visibilityChange);
    document.addEventListener("visibilitychange", visibilityChange);
    prefersReducedMotion.addEventListener("change", visibilityChange);

    return () => {
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", clear);
      window.removeEventListener("uii:focus-mode-changed", visibilityChange);
      document.removeEventListener("visibilitychange", visibilityChange);
      prefersReducedMotion.removeEventListener("change", visibilityChange);
      clear();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="creative-pointer-trail"
      data-active="false"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] h-[100dvh] w-screen select-none"
      style={{ background: "transparent" }}
    />
  );
}
