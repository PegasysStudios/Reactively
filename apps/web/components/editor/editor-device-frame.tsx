"use client";

import { BatteryMedium, Wifi } from "lucide-react";
import type { ReactNode } from "react";

/** Shared phone chrome for the Design canvas and embedded Preview layout. */
export function EditorDeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative aspect-[360/830] h-[calc(100%-8px)] max-h-[830px] min-h-[500px] translate-x-1 rounded-[3.3rem] border-[3px] border-[#292b30] bg-[#111216] p-[9px] shadow-[0_26px_45px_rgba(28,36,52,0.25),0_8px_16px_rgba(28,36,52,0.18)]">
      <div className="relative h-full overflow-hidden rounded-[2.7rem] bg-white ring-1 ring-black/10">
        <div className="absolute left-1/2 top-0 z-10 h-[30px] w-[46%] -translate-x-1/2 rounded-b-[1.15rem] bg-[#111216]" />

        <div className="relative z-0 flex h-11 items-center justify-between px-6 pt-1 text-[10px] font-semibold text-[#11162a]">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-px" aria-hidden>
              <span className="h-1 w-0.5 rounded-sm bg-current" />
              <span className="h-1.5 w-0.5 rounded-sm bg-current" />
              <span className="h-2 w-0.5 rounded-sm bg-current" />
              <span className="h-2.5 w-0.5 rounded-sm bg-current" />
            </span>
            <Wifi className="size-3" aria-hidden />
            <BatteryMedium className="size-3.5" aria-hidden />
          </span>
        </div>

        <div className="h-[calc(100%-44px)] bg-white">{children}</div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 h-1 w-24 -translate-x-1/2 rounded-full bg-[#111216]" />
      </div>
    </div>
  );
}
