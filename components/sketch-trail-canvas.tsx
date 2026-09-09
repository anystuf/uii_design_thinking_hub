"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  life: number;
  width: number;
};

const INTERACTIVE_SELECTOR = "a,button,input,select,textarea,[data-sketch='true']";

export function SketchTrailCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useRef<Point[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const addPoint = (x: number, y: number, active: boolean) => {
      const previous = last.current;
      last.current = { x, y };
      if (!active) return;

      const distance = previous ? Math.hypot(x - previous.x, y - previous.y) : 0;
      if (distance < 4 && previous) return;

      points.current.push({
        x,
        y,
        life: 1,
        width: drawing.current ? 2.2 : 1.35,
      });

      if (points.current.length > 180) {
        points.current.splice(0, points.current.length - 180);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      drawing.current = true;
      addPoint(event.clientX, event.clientY, true);
    };

    const onPointerUp = () => {
      drawing.current = false;
      last.current = null;
    };

    const onPointerMove = (event: PointerEvent) => {
      addPoint(event.clientX, event.clientY, drawing.current || isInteractive(event.target));
    };

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const trail = points.current;

      for (let index = 1; index < trail.length; index += 1) {
        const current = trail[index];
        const previous = trail[index - 1];
        const alpha = Math.max(0, Math.min(current.life, previous.life)) * 0.24;

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.strokeStyle = `rgba(180, 35, 24, ${alpha})`;
        ctx.lineWidth = current.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        if (index % 7 === 0) {
          ctx.beginPath();
          ctx.arc(current.x, current.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180, 35, 24, ${alpha * 0.75})`;
          ctx.fill();
        }
      }

      points.current = trail
        .map((point) => ({ ...point, life: point.life - 0.018 }))
        .filter((point) => point.life > 0);

      frame = requestAnimationFrame(render);
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointerleave", onPointerUp);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerleave", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 mix-blend-multiply"
    />
  );
}
