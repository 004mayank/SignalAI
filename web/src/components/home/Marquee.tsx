"use client";

const PILL_CLASS =
  "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-base font-medium text-zinc-300";

interface Props {
  items: string[];
  reverse?: boolean;
  duration?: number;
}

export function Marquee({ items, reverse = false, duration = 40 }: Props) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];
  const anim = reverse
    ? `marquee-rtl ${duration}s linear infinite`
    : `marquee-ltr ${duration}s linear infinite`;

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <style>{`
        @keyframes marquee-ltr {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes marquee-rtl {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          width: "max-content",
          animation: anim,
        }}
      >
        {doubled.map((s, i) => (
          <span key={i} style={{ flexShrink: 0 }} className={PILL_CLASS}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
