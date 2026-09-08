"use client";

import { resolveEdgeValues } from "@reactively/layout-engine";
import {
  percent,
  points,
  type ComponentNode,
  type ComponentStyle,
  type EdgeValues,
  type LayoutValue,
} from "@reactively/project-schema";
import { useEffect, useState, type ReactNode } from "react";

import { SPACING_EDGES, withSpacingEdge, type SpacingEdge } from "@/lib/editor/spacing-edges";
import { projectCommands } from "@/lib/state/project-commands";
import { useProjectStore } from "@/lib/state/project-store";

import { InspectorNumericField } from "./inspector-numeric-field";
import { InspectorSection } from "./inspector-section";
import { InspectorSelect } from "./inspector-select";

type WidthMode = "auto" | "fill" | "fixed";
type PositionMode = "relative" | "absolute";

const POSITION_OPTIONS = [
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
] as const;

const WIDTH_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "fill", label: "Fill" },
  { value: "fixed", label: "Fixed" },
] as const;

const SPACING_SIDE_LABELS: Record<SpacingEdge, { short: string; name: string }> = {
  top: { short: "T", name: "top" },
  right: { short: "R", name: "right" },
  bottom: { short: "B", name: "bottom" },
  left: { short: "L", name: "left" },
};

/**
 * Shared Position & Layout controls for View, Text and Button.
 *
 * These known layout fields are rendered explicitly for this milestone rather than
 * through a generic property engine. Values still flow through `updateComponentStyle`.
 */
export function PositionLayoutSection({ node }: { node: ComponentNode }) {
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [widthModeOverride, setWidthModeOverride] = useState<WidthMode | null>(null);
  const widthMode = widthModeOverride ?? widthModeFromStyle(node.style.width);

  useEffect(() => {
    setWidthModeOverride(null);
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
          useProjectStore.getState().lastError?.message ?? "The layout could not be updated.",
        );
      }
    } catch (cause: unknown) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The layout could not be saved locally.",
      );
    }
  }

  const isAbsolute = positionModeFromStyle(node.style.position) === "absolute";

  return (
    <InspectorSection title="Position & Layout">
      <LabeledControl label="Position">
        <InspectorSelect
          label="Position"
          value={positionModeFromStyle(node.style.position)}
          options={POSITION_OPTIONS}
          onValueChange={(next) => {
            if (next === "absolute") {
              void updateStyle({ position: "absolute" });
              return;
            }

            if (node.style.position === "absolute") {
              void updateStyle({ position: undefined });
            }
          }}
        />
      </LabeledControl>

      {isAbsolute ? (
        <div className="grid grid-cols-2 gap-2">
          <InspectorNumericField
            label="X"
            value={pointsValue(node.style.left)}
            allowNegative
            onCommit={(value) => void updateStyle({ left: points(value) })}
            onClear={() => void updateStyle({ left: undefined })}
          />
          <InspectorNumericField
            label="Y"
            value={pointsValue(node.style.top)}
            allowNegative
            onCommit={(value) => void updateStyle({ top: points(value) })}
            onClear={() => void updateStyle({ top: undefined })}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 space-y-1">
          <span className="text-[10px] font-medium text-foreground-muted">Width</span>
          <div className="flex min-w-0 items-center gap-1">
            <div className="min-w-0 flex-1">
              <InspectorSelect
                label="Width"
                value={widthMode}
                options={WIDTH_OPTIONS}
                onValueChange={(next) => {
                  const mode = next as WidthMode;
                  setWidthModeOverride(mode);

                  if (mode === "fill") {
                    void updateStyle({ width: percent(100) });
                    return;
                  }

                  if (mode === "auto") {
                    void updateStyle({ width: undefined });
                    return;
                  }

                  if (node.style.width?.type === "points") {
                    setWidthModeOverride(null);
                  }
                }}
              />
            </div>
            {widthMode === "fixed" ? (
              <InspectorNumericField
                label="Width value"
                hideLabel
                value={pointsValue(node.style.width)}
                allowNegative={false}
                onCommit={(value) => void updateStyle({ width: points(value) })}
                onClear={() => void updateStyle({ width: undefined })}
              />
            ) : null}
          </div>
        </div>

        <InspectorNumericField
          label="Height"
          value={pointsValue(node.style.height)}
          allowNegative={false}
          placeholder="Auto"
          onCommit={(value) => void updateStyle({ height: points(value) })}
          onClear={() => void updateStyle({ height: undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SpacingEdgesRow
          label="Margin"
          edges={node.style.margin}
          allowNegative
          onCommit={(edge, value) =>
            void updateStyle({ margin: withSpacingEdge(node.style.margin, edge, value) })
          }
          onClear={(edge) => {
            if (node.style.margin?.[edge] === undefined) {
              return;
            }

            void updateStyle({ margin: withSpacingEdge(node.style.margin, edge, undefined) });
          }}
        />

        <SpacingEdgesRow
          label="Padding"
          edges={node.style.padding}
          allowNegative={false}
          onCommit={(edge, value) =>
            void updateStyle({ padding: withSpacingEdge(node.style.padding, edge, value) })
          }
          onClear={(edge) => {
            if (node.style.padding?.[edge] === undefined) {
              return;
            }

            void updateStyle({ padding: withSpacingEdge(node.style.padding, edge, undefined) });
          }}
        />
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

function SpacingEdgesRow({
  label,
  edges,
  allowNegative,
  onCommit,
  onClear,
}: {
  label: "Margin" | "Padding";
  edges: EdgeValues | undefined;
  allowNegative: boolean;
  onCommit: (edge: SpacingEdge, value: number) => void;
  onClear: (edge: SpacingEdge) => void;
}) {
  const resolved = resolveEdgeValues(edges);

  return (
    <LabeledControl label={label}>
      <div className="grid grid-cols-2 gap-1.5">
        {SPACING_EDGES.map((edge) => {
          const side = SPACING_SIDE_LABELS[edge];
          return (
            <InspectorNumericField
              key={edge}
              label={`${label} ${side.name}`}
              shortLabel={side.short}
              compact
              value={resolved[edge]}
              allowNegative={allowNegative}
              onCommit={(value) => onCommit(edge, value)}
              onClear={() => onClear(edge)}
            />
          );
        })}
      </div>
    </LabeledControl>
  );
}

function positionModeFromStyle(position: ComponentStyle["position"]): PositionMode {
  return position === "absolute" ? "absolute" : "relative";
}

function widthModeFromStyle(width: LayoutValue | undefined): WidthMode {
  if (!width || width.type === "auto") {
    return "auto";
  }

  if (width.type === "percent" && width.value === 100) {
    return "fill";
  }

  return "fixed";
}

function pointsValue(value: LayoutValue | undefined): number | undefined {
  return value?.type === "points" ? value.value : undefined;
}
