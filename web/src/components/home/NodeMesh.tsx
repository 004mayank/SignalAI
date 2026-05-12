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

const NODE_COUNT = 110;
const FOV_FACTOR = 2.8;   // FOV = min(W,H) * FOV_FACTOR
const ROT_SPEED = 0.0012;

interface Node {
  bx: number; by: number; bz: number; // base (original) coords
  x: number;  y: number;  z: number;  // rotated coords
  color: string;
  size: number;
  phase: number;
  phaseSpeed: number;
}

function onSphere(r: number): [number, number, number] {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const sr = r * (0.6 + 0.4 * Math.random()); // vary depth for interior nodes
  return [
    sr * Math.sin(phi) * Math.cos(theta),
    sr * Math.sin(phi) * Math.sin(theta),
    sr * Math.cos(phi),
  ];
}

export function NodeMesh() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const CX = W / 2;
    const CY = H / 2;
    const SPHERE_R = Math.min(W, H) * 0.42;
    const CONNECT_DIST_SQ = (SPHERE_R * 0.58) ** 2;
    const FOV = Math.min(W, H) * FOV_FACTOR;

    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => {
      const [bx, by, bz] = onSphere(SPHERE_R);
      return {
        bx, by, bz,
        x: bx, y: by, z: bz,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 2.8 + 1.2,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.025 + 0.006,
      };
    });

    let angle = 0;
    let tiltAngle = 0;
    let raf: number;

    function project(x: number, y: number, z: number) {
      const s = FOV / (FOV + z + SPHERE_R);
      return { sx: CX + x * s, sy: CY + y * s, s };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += ROT_SPEED;
      tiltAngle += ROT_SPEED * 0.3;

      const cosY = Math.cos(angle), sinY = Math.sin(angle);
      const cosX = Math.cos(tiltAngle * 0.4), sinX = Math.sin(tiltAngle * 0.4);

      for (const n of nodes) {
        // Rotate around Y axis
        const rx = n.bx * cosY + n.bz * sinY;
        const ry0 = n.by;
        const rz = -n.bx * sinY + n.bz * cosY;
        // Slight tilt around X axis
        n.x = rx;
        n.y = ry0 * cosX - rz * sinX;
        n.z = ry0 * sinX + rz * cosX;
        n.phase += n.phaseSpeed;
      }

      // Sort back-to-front for painter's algorithm
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

          // Depth-fade + distance-fade
          const depthFactor = (a.z + b.z) / 2 / SPHERE_R; // -1 to 1
          const distFactor = 1 - distSq / CONNECT_DIST_SQ;
          const alpha = (0.06 + 0.14 * distFactor) * (0.5 + 0.5 * ((depthFactor + 1) / 2));

          ctx.beginPath();
          ctx.moveTo(pa.sx, pa.sy);
          ctx.lineTo(pb.sx, pb.sy);
          ctx.strokeStyle = `rgba(120,180,220,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.5 * ((pa.s + pb.s) / 2);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of sorted) {
        const { sx, sy, s } = project(n.x, n.y, n.z);
        const glow = 0.5 + 0.5 * Math.sin(n.phase);
        const coreAlpha = 0.45 + 0.55 * glow;
        const r = n.size * s * (0.85 + 0.35 * glow);
        const glowR = r * 5;

        // Soft glow halo
        if (glow > 0.3) {
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
          const hex = Math.round(coreAlpha * 0.45 * 255).toString(16).padStart(2, "0");
          grad.addColorStop(0, n.color + hex);
          grad.addColorStop(1, n.color + "00");
          ctx.beginPath();
          ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = coreAlpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
