import { clsx } from "clsx";

export function Badge(props: { children: React.ReactNode; variant?: "default" | "muted" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        props.variant === "muted"
          ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
          : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
      )}
    >
      {props.children}
    </span>
  );
}
