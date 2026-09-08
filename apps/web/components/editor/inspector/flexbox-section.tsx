"use client";

import { REACT_NATIVE_LAYOUT_DEFAULTS } from "@reactively/layout-engine";
import type { AlignSelf, ComponentNode, ComponentStyle } from "@reactively/project-schema";
import { useEffect, useState, type ReactNode } from "react";

import { projectCommands } from "@/lib/state/project-commands";
import { useProjectStore } from "@/lib/state/project-store";

import { InspectorNumericField } from "./inspector-numeric-field";
import { InspectorSection } from "./inspector-section";
import { InspectorSelect } from "./inspector-select";

const ALIGN_SELF_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "flex-start", label: "Flex Start" },
  { value: "flex-end", label: "Flex End" },
  { value: "center", label: "Center" },
  { value: "stretch", label: "Stretch" },
] as const;

type InspectorAlignSelf = (typeof ALIGN_SELF_OPTIONS)[number]["value"];

const INSPECTOR_ALIGN_SELF_VALUES = new Set<string>(
  ALIGN_SELF_OPTIONS.map((option) => option.value),
);

/**
 * Shared Flex item controls for View, Text and Button.
 *
 * Parent-container Flexbox (`flexDirection`, `justifyContent`, `alignItems`, `gap`) is
 * intentionally absent until nested parenting exists. Values still flow through
 * `updateComponentStyle`.
 */
export function FlexboxSection({ node }: { node: ComponentNode }) {
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    setPersistenceError(null);
  }, [node.id]);

  async function updateStyle(style: ComponentStyle) {
    setPersistenceError(null);

    try {
      const applied = await projectCommands.updateComponentStyle({
        nodeId: node.id,
        style,
      });

      if (!applied) {
        setPersistenceError(
          useProjectStore.getState().lastError?.message ??
            "The Flexbox values could not be updated.",
        );
      }
    } catch (cause: unknown) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The Flexbox values could not be saved locally.",
      );
    }
  }

  const flexGrow = node.style.flexGrow ?? REACT_NATIVE_LAYOUT_DEFAULTS.flexGrow;
  const flexShrink = node.style.flexShrink ?? REACT_NATIVE_LAYOUT_DEFAULTS.flexShrink;
  const alignSelf = inspectorAlignSelf(node.style.alignSelf);

  return (
    <InspectorSection title="Flexbox">
      <div className="grid grid-cols-2 gap-2">
        <InspectorNumericField
          label="Flex Grow"
          value={flexGrow}
          allowNegative={false}
          onCommit={(value) => void updateStyle({ flexGrow: value })}
          onClear={() => {
            if (node.style.flexGrow === undefined) {
              return;
            }

            void updateStyle({ flexGrow: undefined });
          }}
        />
        <InspectorNumericField
          label="Flex Shrink"
          value={flexShrink}
          allowNegative={false}
          onCommit={(value) => void updateStyle({ flexShrink: value })}
          onClear={() => {
            if (node.style.flexShrink === undefined) {
              return;
            }

            void updateStyle({ flexShrink: undefined });
          }}
        />
      </div>

      <LabeledControl label="Align Self">
        <InspectorSelect
          label="Align Self"
          value={alignSelf}
          options={ALIGN_SELF_OPTIONS}
          onValueChange={(next) => {
            if (!isInspectorAlignSelf(next) || next === alignSelf) {
              return;
            }

            void updateStyle({ alignSelf: next });
          }}
        />
      </LabeledControl>

      {persistenceError ? (
        <p role="alert" className="text-[10px] text-danger">
          {persistenceError}
        </p>
      ) : null}
    </InspectorSection>
  );
}

function LabeledControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block space-y-1">
      <span className="text-[10px] font-medium text-foreground-muted">{label}</span>
      {children}
    </div>
  );
}

function inspectorAlignSelf(value: AlignSelf | undefined): InspectorAlignSelf {
  if (value !== undefined && isInspectorAlignSelf(value)) {
    return value;
  }

  return REACT_NATIVE_LAYOUT_DEFAULTS.alignSelf;
}

function isInspectorAlignSelf(value: string): value is InspectorAlignSelf {
  return INSPECTOR_ALIGN_SELF_VALUES.has(value);
}
