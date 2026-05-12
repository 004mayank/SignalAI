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

const NODE_COUNT = 120;
const ROT_SPEED = 0.0012;

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
  const sr = r * (0.55 + 0.45 * Math.random());
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
    // Use 48% of smallest dimension for sphere, capped generously
    const SPHERE_R = Math.min(W, H) * 0.48;
    const CONNECT_DIST_SQ = (SPHERE_R * 0.62) ** 2;
    // Lower FOV = more dramatic perspective depth
    const FOV = Math.min(W, H) * 1.8;

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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      angle += ROT_SPEED;
      tiltAngle += ROT_SPEED * 0.3;

      const cosY = Math.cos(angle), sinY = Math.sin(angle);
      const cosX = Math.cos(tiltAngle * 0.4), sinX = Math.sin(tiltAngle * 0.4);

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

      // Edges — more visible
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i], b = sorted[j];
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > CONNECT_DIST_SQ) continue;

          const pa = project(a.x, a.y, a.z);
          const pb = project(b.x, b.y, b.z);

          const depthFactor = ((a.z + b.z) / 2 / SPHERE_R + 1) / 2; // 0 to 1
          const distFactor = 1 - distSq / CONNECT_DIST_SQ;
          const alpha = (0.12 + 0.22 * distFactor) * (0.35 + 0.65 * depthFactor);

          ctx.beginPath();
          ctx.moveTo(pa.sx, pa.sy);
          ctx.lineTo(pb.sx, pb.sy);
          ctx.strokeStyle = `rgba(140,200,240,${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.7 * ((pa.s + pb.s) / 2);
          ctx.stroke();
        }
      }

      // Nodes — crisp and bright
      for (const n of sorted) {
        const { sx, sy, s } = project(n.x, n.y, n.z);
        const glow = 0.5 + 0.5 * Math.sin(n.phase);
        // Depth fade: back nodes slightly dimmer
        const depth = (n.z / SPHERE_R + 1) / 2; // 0 (back) to 1 (front)
        const brightness = 0.55 + 0.45 * depth;

        const r = n.size * s * (1.0 + 0.4 * glow);

        // Tight, intense inner glow
        const innerGlowR = r * 3.2;
        const innerA = (0.55 + 0.45 * glow) * brightness;
        const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, innerGlowR);
        innerGrad.addColorStop(0, n.color + hexAlpha(innerA * 0.9));
        innerGrad.addColorStop(0.4, n.color + hexAlpha(innerA * 0.4));
        innerGrad.addColorStop(1, n.color + "00");
        ctx.beginPath();
        ctx.arc(sx, sy, innerGlowR, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Wider soft bloom when bright
        if (glow > 0.5) {
          const bloomR = r * 6;
          const bloomA = (glow - 0.5) * 0.5 * brightness;
          const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
          bloom.addColorStop(0, n.color + hexAlpha(bloomA));
          bloom.addColorStop(1, n.color + "00");
          ctx.beginPath();
          ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
          ctx.fillStyle = bloom;
          ctx.fill();
        }

        // Solid bright core
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = (0.88 + 0.12 * glow) * brightness;
        ctx.fill();

        // Specular white highlight
        ctx.beginPath();
        ctx.arc(sx - r * 0.28, sy - r * 0.28, r * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.35 * glow * brightness;
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
