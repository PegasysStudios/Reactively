"use client";

import type {
  ComponentDefinition,
  ComponentPropertyDefinition,
} from "@reactively/component-registry";
import type { ComponentNode } from "@reactively/project-schema";
import { useState } from "react";

import { projectCommands } from "@/lib/state/project-commands";
import { useProjectStore } from "@/lib/state/project-store";

import { InspectorSection } from "./inspector-section";

/**
 * The first deliberately small registry-driven control surface.
 *
 * Only direct string props are supported in this milestone. Other registry property
 * types remain metadata until their dedicated inspector controls are introduced.
 */
export function ComponentProperties({
  node,
  definition,
}: {
  node: ComponentNode;
  definition: ComponentDefinition | undefined;
}) {
  const properties = definition?.properties.filter(isEditableTextProperty) ?? [];

  if (properties.length === 0) {
    return (
      <InspectorSection title="Component">
        <ReadOnlyProperty label="Type" value={definition?.label ?? node.type} />
      </InspectorSection>
    );
  }

  const sections = groupPropertiesBySection(properties);

  return sections.map(([section, sectionProperties]) => (
    <InspectorSection key={section} title={section}>
      {sectionProperties.map((property) => (
        <TextPropertyField key={property.id} node={node} property={property} />
      ))}
    </InspectorSection>
  ));
}

function TextPropertyField({
  node,
  property,
}: {
  node: ComponentNode;
  property: ComponentPropertyDefinition;
}) {
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const storedValue = node.props[property.path];
  const value = typeof storedValue === "string" ? storedValue : "";

  async function updateValue(nextValue: string) {
    setPersistenceError(null);

    try {
      const applied = await projectCommands.updateComponentProps({
        nodeId: node.id,
        props: { [property.path]: nextValue },
      });

      if (!applied) {
        setPersistenceError(
          useProjectStore.getState().lastError?.message ?? "The property could not be updated.",
        );
      }
    } catch (cause: unknown) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The property could not be saved locally.",
      );
    }
  }

  return (
    <label className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2">
      <span className="text-[10px] font-medium text-foreground-muted">{property.label}</span>
      <input
        type="text"
        aria-label={property.label}
        value={value}
        onChange={(event) => void updateValue(event.target.value)}
        className="h-8 min-w-0 rounded-md border border-border bg-background px-2.5 text-[11px] text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
      {persistenceError ? (
        <span role="alert" className="col-start-2 text-[10px] text-danger">
          {persistenceError}
        </span>
      ) : null}
    </label>
  );
}

function ReadOnlyProperty({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2">
      <span className="text-[10px] font-medium text-foreground-muted">{label}</span>
      <span className="truncate text-[11px] text-foreground">{value}</span>
    </div>
  );
}

function isEditableTextProperty(property: ComponentPropertyDefinition): boolean {
  return (
    property.target === "prop" &&
    property.valueType === "string" &&
    !property.path.includes(".")
  );
}

function groupPropertiesBySection(
  properties: readonly ComponentPropertyDefinition[],
): ReadonlyArray<readonly [string, readonly ComponentPropertyDefinition[]]> {
  const sections = new Map<string, ComponentPropertyDefinition[]>();

  for (const property of properties) {
    const section = sections.get(property.section) ?? [];
    section.push(property);
    sections.set(property.section, section);
  }

  return [...sections.entries()];
}
