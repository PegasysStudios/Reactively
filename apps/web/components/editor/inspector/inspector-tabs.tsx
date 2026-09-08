"use client";

import type { InspectorPanel } from "@reactively/editor-engine";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";

import { useEditorStore } from "@/lib/state/editor-store";

export function InspectorTabs({
  properties,
  style,
}: {
  properties: ReactNode;
  style: ReactNode;
}) {
  const activePanel = useEditorStore((state) => state.activeInspectorPanel);
  const setActivePanel = useEditorStore((state) => state.setInspectorPanel);

  function selectPanel(value: string) {
    if (value === "properties" || value === "style") {
      setActivePanel(value satisfies InspectorPanel);
    }
  }

  return (
    <Tabs.Root
      value={activePanel}
      onValueChange={selectPanel}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 border-b border-border px-3 py-2">
        <Tabs.List
          aria-label="Inspector tabs"
          className="grid h-8 grid-cols-2 rounded-md bg-surface-muted p-0.5"
        >
          <InspectorTab value="properties">Properties</InspectorTab>
          <InspectorTab value="style">Style</InspectorTab>
        </Tabs.List>
      </div>

      <Tabs.Content value="properties" className="min-h-0 flex-1 outline-none">
        {properties}
      </Tabs.Content>
      <Tabs.Content value="style" className="min-h-0 flex-1 outline-none">
        {style}
      </Tabs.Content>
    </Tabs.Root>
  );
}

function InspectorTab({ value, children }: { value: InspectorPanel; children: ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="rounded-[5px] text-[11px] font-medium text-foreground-muted transition-colors data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
    >
      {children}
    </Tabs.Trigger>
  );
}
