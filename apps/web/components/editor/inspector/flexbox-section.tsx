"use client";

import type { ComponentDefinition } from "@reactively/component-registry";
import { REACT_NATIVE_LAYOUT_DEFAULTS } from "@reactively/layout-engine";
import {
  AlignItemsSchema,
  FlexDirectionSchema,
  JustifyContentSchema,
  type AlignSelf,
  type ComponentNode,
  type ComponentStyle,
} from "@reactively/project-schema";
import { useEffect, useState, type ReactNode } from "react";

import { projectCommands } from "@/lib/state/project-commands";
import { useProjectStore } from "@/lib/state/project-store";

import { InspectorNumericField } from "./inspector-numeric-field";
import { InspectorSection } from "./inspector-section";
import { InspectorSelect, type InspectorSelectOption } from "./inspector-select";

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
 * Flexbox controls backed by registry capability metadata.
 *
 * Every MVP primitive is a Flex item. Only View is a container, so only it exposes the
 * styles that lay out direct children. All changes use the semantic project command.
 */
export function FlexboxSection({
  node,
  definition,
}: {
  node: ComponentNode;
  definition: ComponentDefinition | undefined;
}) {
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const supportsContainerLayout = definition?.capabilities.supportsContainerLayout ?? false;

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
  const flexDirection =
    node.style.flexDirection ?? REACT_NATIVE_LAYOUT_DEFAULTS.flexDirection;
  const justifyContent =
    node.style.justifyContent ?? REACT_NATIVE_LAYOUT_DEFAULTS.justifyContent;
  const alignItems = node.style.alignItems ?? REACT_NATIVE_LAYOUT_DEFAULTS.alignItems;
  const gap = node.style.gap ?? REACT_NATIVE_LAYOUT_DEFAULTS.gap;

  return (
    <InspectorSection title="Flexbox">
      {supportsContainerLayout ? (
        <div className="space-y-3">
          <LabeledControl label="Flex Direction">
            <InspectorSelect
              label="Flex Direction"
              value={flexDirection}
              options={stringOptionsFor(definition, "flexDirection")}
              onValueChange={(next) => {
                const parsed = FlexDirectionSchema.safeParse(next);
                if (!parsed.success || parsed.data === flexDirection) {
                  return;
                }

                void updateStyle({ flexDirection: parsed.data });
              }}
            />
          </LabeledControl>

          <LabeledControl label="Justify Content">
            <InspectorSelect
              label="Justify Content"
              value={justifyContent}
              options={stringOptionsFor(definition, "justifyContent")}
              onValueChange={(next) => {
                const parsed = JustifyContentSchema.safeParse(next);
                if (!parsed.success || parsed.data === justifyContent) {
                  return;
                }

                void updateStyle({ justifyContent: parsed.data });
              }}
            />
          </LabeledControl>

          <LabeledControl label="Align Items">
            <InspectorSelect
              label="Align Items"
              value={alignItems}
              options={stringOptionsFor(definition, "alignItems")}
              onValueChange={(next) => {
                const parsed = AlignItemsSchema.safeParse(next);
                if (!parsed.success || parsed.data === alignItems) {
                  return;
                }

                void updateStyle({ alignItems: parsed.data });
              }}
            />
          </LabeledControl>

          <InspectorNumericField
            label="Gap"
            value={gap}
            allowNegative={false}
            onCommit={(value) => void updateStyle({ gap: value })}
            onClear={() => {
              if (node.style.gap === undefined) {
                return;
              }

              void updateStyle({ gap: undefined });
            }}
          />
        </div>
      ) : null}

      <div className={supportsContainerLayout ? "space-y-3 border-t border-border pt-3" : "space-y-3"}>
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
      </div>

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

function stringOptionsFor(
  definition: ComponentDefinition | undefined,
  propertyId: string,
): readonly InspectorSelectOption[] {
  const property = definition?.properties.find((candidate) => candidate.id === propertyId);
  return (property?.options ?? []).flatMap((option) =>
    typeof option.value === "string" ? [{ value: option.value, label: option.label }] : [],
  );
}
