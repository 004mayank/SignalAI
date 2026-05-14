"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#22d3ee", // cyan
  "#a855f7", // purple
  "#84cc16", // lime
  "#f59e0b", // amber
  "#ec4899", // pink
  "#6366f1", // indigo
  "#34d399", // emerald
];

const NODE_COUNT = 180;
const ROT_SPEED = 0.0012;
// Cursor proximity boost radius in screen px
const CURSOR_RADIUS = 110;
const CURSOR_RADIUS_SQ = CURSOR_RADIUS * CURSOR_RADIUS;

interface Node {
  bx: number; by: number; bz: number;
  x: number;  y: number;  z: number;
  color: string;
  size: number;
  phase: number;
  phaseSpeed: number;
}

function onSphere(r: number): [number, number, number] {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const sr = Math.random() < 0.8
    ? r * (0.9 + 0.1 * Math.random())
    : r * (0.4 + 0.4 * Math.random());
  return [
    sr * Math.sin(phi) * Math.cos(theta),
    sr * Math.sin(phi) * Math.sin(theta),
    sr * Math.cos(phi),
  ];
}

export function NodeMesh() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const CX = W / 2;
    const CY = H / 2;
    const SPHERE_R = Math.min(W, H) * 0.52;
    const CONNECT_DIST_SQ = (SPHERE_R * 0.68) ** 2;
    const FOV = Math.min(W, H) * 2.4;

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => {
      const [bx, by, bz] = onSphere(SPHERE_R);
      return {
        bx, by, bz,
        x: bx, y: by, z: bz,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 3.5 + 1.8,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.025 + 0.007,
      };
    });

    // Mouse state — in canvas CSS pixels
    let mouseX = -9999;
    let mouseY = -9999;
    // Target rotation offsets driven by mouse
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;
    let isHovering = false;

    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      // Map cursor to -1..1 and drive tilt offsets
      targetOffsetX = ((mouseY / H) - 0.5) * 0.6;  // tilt up/down
      targetOffsetY = ((mouseX / W) - 0.5) * 0.8;  // spin left/right
    }
    function onMouseEnter() { isHovering = true; }
    function onMouseLeave() {
      isHovering = false;
      mouseX = -9999;
      mouseY = -9999;
      targetOffsetX = 0;
      targetOffsetY = 0;
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let angle = 0;
    let tiltAngle = 0;
    let raf: number;

    function project(x: number, y: number, z: number) {
      const s = FOV / (FOV + z + SPHERE_R);
      return { sx: CX + x * s, sy: CY + y * s, s };
    }

    function hexAlpha(value: number) {
      return Math.round(Math.max(0, Math.min(1, value)) * 255)
        .toString(16)
        .padStart(2, "0");
    }

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Auto-rotate (slows slightly on hover for more responsive feel)
      const rotMult = isHovering ? 0.3 : 1;
      angle += ROT_SPEED * rotMult;
      tiltAngle += ROT_SPEED * 0.3 * rotMult;

      // Smoothly lerp mouse-driven offsets
      currentOffsetX = lerp(currentOffsetX, targetOffsetX, 0.06);
      currentOffsetY = lerp(currentOffsetY, targetOffsetY, 0.06);

      const totalAngleY = angle + currentOffsetY;
      const totalAngleX = tiltAngle * 0.4 + currentOffsetX;

      const cosY = Math.cos(totalAngleY), sinY = Math.sin(totalAngleY);
      const cosX = Math.cos(totalAngleX), sinX = Math.sin(totalAngleX);

      for (const n of nodes) {
        const rx = n.bx * cosY + n.bz * sinY;
        const ry0 = n.by;
        const rz = -n.bx * sinY + n.bz * cosY;
        n.x = rx;
        n.y = ry0 * cosX - rz * sinX;
        n.z = ry0 * sinX + rz * cosX;
        n.phase += n.phaseSpeed;
      }

      const sorted = [...nodes].sort((a, b) => a.z - b.z);

      // Edges
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i], b = sorted[j];
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > CONNECT_DIST_SQ) continue;

          const pa = project(a.x, a.y, a.z);
          const pb = project(b.x, b.y, b.z);

          const depthFactor = ((a.z + b.z) / 2 / SPHERE_R + 1) / 2;
          const distFactor = 1 - distSq / CONNECT_DIST_SQ;

          // Check if either endpoint is near cursor
          const nearCursor =
            (pa.sx - mouseX) ** 2 + (pa.sy - mouseY) ** 2 < CURSOR_RADIUS_SQ ||
            (pb.sx - mouseX) ** 2 + (pb.sy - mouseY) ** 2 < CURSOR_RADIUS_SQ;

          const baseAlpha = (0.12 + 0.22 * distFactor) * (0.35 + 0.65 * depthFactor);
          const alpha = nearCursor ? Math.min(baseAlpha * 2.0, 0.45) : baseAlpha;

          ctx.beginPath();
          ctx.moveTo(pa.sx, pa.sy);
          ctx.lineTo(pb.sx, pb.sy);
          ctx.strokeStyle = nearCursor
            ? `rgba(160,210,255,${alpha.toFixed(3)})`
            : `rgba(140,200,240,${alpha.toFixed(3)})`;
          ctx.lineWidth = nearCursor ? 0.9 * ((pa.s + pb.s) / 2) : 0.7 * ((pa.s + pb.s) / 2);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of sorted) {
        const { sx, sy, s } = project(n.x, n.y, n.z);

        // Cursor proximity — 0 (far) to 1 (very close)
        const cdx = sx - mouseX, cdy = sy - mouseY;
        const cDistSq = cdx * cdx + cdy * cdy;
        const cursorBoost = cDistSq < CURSOR_RADIUS_SQ
          ? 1 - cDistSq / CURSOR_RADIUS_SQ
          : 0;

        const glow = 0.5 + 0.5 * Math.sin(n.phase);
        const depth = (n.z / SPHERE_R + 1) / 2;
        const brightness = (0.55 + 0.45 * depth) + cursorBoost * 0.25;

        const sizeBoost = 1 + cursorBoost * 0.55;
        const r = n.size * s * (1.0 + 0.4 * glow) * sizeBoost;

        // Inner glow
        const innerGlowR = r * (3.2 + cursorBoost * 2);
        const innerA = (0.55 + 0.45 * glow) * Math.min(brightness, 1.5);
        const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, innerGlowR);
        innerGrad.addColorStop(0, n.color + hexAlpha(Math.min(innerA * 0.9, 1)));
        innerGrad.addColorStop(0.4, n.color + hexAlpha(Math.min(innerA * 0.4, 1)));
        innerGrad.addColorStop(1, n.color + "00");
        ctx.beginPath();
        ctx.arc(sx, sy, innerGlowR, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Wide bloom
        if (glow > 0.4 || cursorBoost > 0.1) {
          const bloomR = r * (6 + cursorBoost * 2);
          const bloomA = ((glow - 0.4) * 0.4 + cursorBoost * 0.2) * Math.min(brightness, 1);
          if (bloomA > 0) {
            const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
            bloom.addColorStop(0, n.color + hexAlpha(Math.min(bloomA, 1)));
            bloom.addColorStop(1, n.color + "00");
            ctx.beginPath();
            ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
            ctx.fillStyle = bloom;
            ctx.fill();
          }
        }

        // Solid core
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = Math.min((0.88 + 0.12 * glow) * Math.min(brightness, 1.2), 1);
        ctx.fill();

        // Specular highlight
        ctx.beginPath();
        ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = Math.min(0.35 * glow * brightness + cursorBoost * 0.12, 0.7);
        ctx.fill();

        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full cursor-crosshair" />;
}
