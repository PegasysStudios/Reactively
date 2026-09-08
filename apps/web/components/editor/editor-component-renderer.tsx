import { getComponentDefinition } from "@reactively/component-registry";
import type { ComponentNode, NodeId } from "@reactively/project-schema";
import type { ComponentType, KeyboardEvent, MouseEvent } from "react";

import {
  componentPaddingToEditorCss,
  componentStyleToEditorCss,
} from "@/lib/editor/layout-style-css";
import { cn } from "@/lib/utils";

type ComponentRenderer = ComponentType<{ node: ComponentNode }>;

const renderers: Readonly<Record<string, ComponentRenderer>> = {
  View: ViewRenderer,
  Text: TextRenderer,
  Button: ButtonRenderer,
};

/** Small editor-only rendering and selection boundary for supported project node types. */
export function EditorComponentRenderer({
  node,
  isSelected,
  onSelect,
}: {
  node: ComponentNode;
  isSelected: boolean;
  onSelect: (nodeId: NodeId) => void;
}) {
  const Renderer = renderers[node.type];
  if (!Renderer) {
    return (
      <div className="rounded-md border border-danger/30 bg-red-50 px-3 py-2 text-xs text-danger">
        Unsupported component: {node.type}
      </div>
    );
  }

  const selectNode = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onSelect(node.id);
  };

  const selectNodeWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onSelect(node.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select ${node.name}`}
      aria-pressed={isSelected}
      data-editor-node-id={node.id}
      data-selected={isSelected ? "true" : "false"}
      className={cn(
        "cursor-pointer outline-none transition-shadow",
        isSelected && "outline-2 outline-primary outline-dashed outline-offset-2",
      )}
      style={componentStyleToEditorCss(node.style)}
      onClick={selectNode}
      onKeyDown={selectNodeWithKeyboard}
    >
      <Renderer node={node} />
    </div>
  );
}

function ViewRenderer({ node }: { node: ComponentNode }) {
  const hasExplicitHeight = node.style.height?.type === "points";
  const hasPadding = node.style.padding !== undefined;

  return (
    <span
      className={cn(
        "flex w-full items-center justify-center rounded-lg border border-dashed border-[#aeb7c8] bg-[#f8f9fc] text-xs font-medium text-[#6c778d]",
        hasExplicitHeight ? "h-full" : "min-h-16",
        !hasPadding && "px-3",
        !hasPadding && !hasExplicitHeight && "py-4",
      )}
      style={componentPaddingToEditorCss(node.style)}
    >
      {getComponentDefinition(node.type)?.label}
    </span>
  );
}

function TextRenderer({ node }: { node: ComponentNode }) {
  const content = typeof node.props.content === "string" ? node.props.content : "";
  return (
    <span className="block text-base text-[#11162a]" style={componentPaddingToEditorCss(node.style)}>
      {content}
    </span>
  );
}

function ButtonRenderer({ node }: { node: ComponentNode }) {
  const label = typeof node.props.label === "string" ? node.props.label : "";
  const hasExplicitHeight = node.style.height?.type === "points";
  const hasPadding = node.style.padding !== undefined;

  return (
    <span
      className={cn(
        "block w-full rounded-[10px] bg-[#3b5bfd] text-center text-sm font-semibold text-white",
        hasExplicitHeight && "flex h-full items-center justify-center",
        !hasPadding && "px-5",
        !hasPadding && !hasExplicitHeight && "py-3",
      )}
      style={componentPaddingToEditorCss(node.style)}
    >
      {label}
    </span>
  );
}
