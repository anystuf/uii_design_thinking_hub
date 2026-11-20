"use client";

import { useEffect, useRef } from "react";

type InkPoint = { x: number; y: number; time: number };

const INK_LIFETIME_MS = 860;
const MAX_POINTS = 95;
const PAUSE_BETWEEN_STROKES_MS = 450;

/**
 * An auto-on, truly hand-drawn red line — not a custom red cursor dot.
 * The user draws by moving the mouse/trackpad in any part of the platform.
 *
 * Reduced Motion still renders a RED LINE, without any animation or fade:
 * previously that preference removed the line entirely and left only a dot.
 * Focus Mode always hides ink to keep the interface distraction-free.
 */
export function CreativePointerTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const points: InkPoint[] = [];
    let raf = 0;
    let width = 1;
    let height = 1;
    let lastMove = 0;
    let staticClear: ReturnType<typeof setTimeout> | undefined;

    const disabled = () =>
      document.documentElement.dataset.uiiFocusMode === "true" ||
      document.visibilityState === "hidden";

    const clear = () => {
      points.length = 0;
      if (staticClear) clearTimeout(staticClear);
      staticClear = undefined;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      context.clearRect(0, 0, width, height);
      canvas.dataset.active = "false";
      canvas.dataset.pointCount = "0";
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      clear();
    };

    const paint = (now: number) => {
      raf = 0;
      if (disabled()) {
        clear();
        return;
      }
      context.clearRect(0, 0, width, height);
      if (points.length < 2) {
        canvas.dataset.active = "false";
        return;
      }

      const latest = points[points.length - 1];
      const reduced = motionPreference.matches;
      const age = Math.max(0, now - latest.time);
      if (!reduced && age > INK_LIFETIME_MS) {
        clear();
        return;
      }
      context.save();
      context.strokeStyle = "#eb302b";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.6;
      // Each tiny segment independently fades according to its AGE and
      // position in the stroke. This avoids a heavy opaque line over text,
      // eliminates the 1.8-second hold and makes the tail translucent.
      for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const current = points[i];
        const freshness = reduced ? 1 : Math.max(0, 1 - (now - current.time) / INK_LIFETIME_MS);
        const tail = 0.34 + 0.66 * i / (points.length - 1);
        const alpha = (reduced ? tail : freshness * freshness * tail) * 0.83;
        if (alpha < 0.015) continue;
        context.globalAlpha = alpha;
        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(current.x, current.y);
        context.stroke();
      }
      context.restore();

      // Keep the actual stroke as the only UI, instead of a standalone dot.
      canvas.dataset.active = "true";
      canvas.dataset.pointCount = String(points.length);
      canvas.dataset.renderMode = reduced ? "trail-static" : "trail";

      // Reduced Motion: paint synchronously on mouse events, no RAF animation.
      if (!reduced) raf = requestAnimationFrame(paint);
    };

    const record = (x: number, y: number) => {
      if (disabled()) {
        clear();
        return;
      }
      if (x < 0 || y < 0 || x > width || y > height) return;
      const now = performance.now();
      const last = points[points.length - 1];
      // A pause starts a new sketch rather than connecting two unrelated
      // positions with a long, distracting line.
      if (now - lastMove > PAUSE_BETWEEN_STROKES_MS) points.length = 0;
      lastMove = now;
      if (last && points.length && Math.hypot(x - last.x, y - last.y) < 2) return;
      points.push({ x, y, time: now });
      if (points.length > MAX_POINTS) points.shift();

      if (motionPreference.matches) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (staticClear) clearTimeout(staticClear);
        paint(now);
        // Reduced Motion skips fade animation, but never leaves static ink
        // covering the page indefinitely.
        staticClear = setTimeout(clear, 700);
      } else if (!raf) {
        raf = requestAnimationFrame(paint);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen")
        record(e.clientX, e.clientY);
    };
    // PointerEvent is supported in all target browsers. Avoid double recording
    // the same movement as both pointermove and mousemove.
    const onPreferenceChange = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (disabled()) clear();
      else paint(performance.now());
    };

    resize();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", clear, { passive: true });
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onPreferenceChange);
    window.addEventListener("uii:focus-mode-changed", onPreferenceChange);
    motionPreference.addEventListener("change", onPreferenceChange);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", clear);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onPreferenceChange);
      window.removeEventListener("uii:focus-mode-changed", onPreferenceChange);
      motionPreference.removeEventListener("change", onPreferenceChange);
      clear();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="creative-pointer-trail"
      data-active="false"
      data-point-count="0"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] h-[100dvh] w-screen select-none"
      style={{ background: "transparent" }}
    />
  );
}
