"use client";

import {
  Box,
  ChevronDown,
  FileText,
  Image,
  Layers3,
  LayoutGrid,
  Palette,
  Plus,
} from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ComponentLibraryPanel } from "./component-library-panel";

/**
 * Left tool rail and stacked Pages, Layers and Component Library panels.
 */
export function EditorSidebar({
  screenName,
  rootNodeName,
  rootNodeId,
}: {
  screenName: string;
  rootNodeName: string | null;
  rootNodeId: string;
}) {
  return (
    <aside className="flex w-[368px] shrink-0 bg-editor-workspace">
      <nav
        aria-label="Editor tools"
        className="flex w-[68px] shrink-0 flex-col items-center gap-2 border-r border-border bg-background px-2 py-3"
      >
        <ToolRailItem icon={FileText} label="Pages" active />
        <ToolRailItem icon={LayoutGrid} label="Components" />
        <ToolRailItem icon={Image} label="Assets" />
        <ToolRailItem icon={Palette} label="Theme" />
      </nav>

      <div className="grid min-w-0 flex-1 grid-rows-[196px_minmax(180px,0.92fr)_minmax(220px,1fr)] gap-2 p-2 pr-0">
        <Panel title="Pages" action={<PanelAddButton label="Add page" />}>
          <div className="mx-2 flex h-9 items-center gap-2 rounded-md bg-primary-soft px-3 text-sm font-medium text-primary">
            <FileText className="size-4" aria-hidden />
            <span className="truncate">{screenName}</span>
          </div>
        </Panel>

        <Panel title="Layers" action={<PanelAddButton label="Add layer" />} className="min-h-0">
          <ScrollArea className="h-full">
            <div className="px-3 pb-3 text-sm">
              <div className="flex h-8 items-center gap-2 font-medium text-foreground">
                <ChevronDown className="size-3.5 text-foreground-muted" aria-hidden />
                <Layers3 className="size-3.5 text-foreground-muted" aria-hidden />
                <span className="truncate">{screenName} (Screen)</span>
              </div>
              {rootNodeName ? (
                <div className="ml-5 flex h-8 items-center gap-2 text-foreground-muted">
                  <Box className="size-3.5" aria-hidden />
                  <span className="truncate">{rootNodeName}</span>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </Panel>

        <Panel title="Component Library" className="min-h-0">
          <ComponentLibraryPanel parentId={rootNodeId} />
        </Panel>
      </div>
    </aside>
  );
}

function ToolRailItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof FileText;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-14 w-12 flex-col items-center justify-center gap-1 rounded-lg bg-primary-soft text-primary"
          : "flex h-14 w-12 flex-col items-center justify-center gap-1 rounded-lg text-foreground-muted"
      }
    >
      <Icon className="size-4" aria-hidden />
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function PanelAddButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md border border-border bg-background text-foreground-muted"
    >
      <Plus className="size-4" aria-hidden />
    </button>
  );
}
