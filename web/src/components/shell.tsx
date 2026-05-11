import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";

export function Shell(props: { children: React.ReactNode; sidebarFilters?: boolean }) {
  return (
    <div className="min-h-dvh bg-[#07090d] text-zinc-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
        <Suspense fallback={<div className="hidden w-[280px] shrink-0 md:block" />}>
          <AppSidebar showFilters={props.sidebarFilters ?? true} />
        </Suspense>
        <main className="w-full flex-1 px-4 py-6 md:px-10">{props.children}</main>
      </div>
    </div>
  );
}
