"use client";

import { listComponentDefinitions } from "@reactively/component-registry";
import type { NodeId } from "@reactively/project-schema";
import { MousePointerClick, Search, Square, Type } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import { projectCommands } from "@/lib/state/project-commands";
import { useProjectStore } from "@/lib/state/project-store";

const componentDefinitions = listComponentDefinitions();
const componentIcons: Readonly<Record<string, ComponentType<{ className?: string }>>> = {
  Square,
  Type,
  MousePointerClick,
};

/** Minimal searchable click-to-insert surface backed by the component registry. */
export function ComponentLibraryPanel({ parentId }: { parentId: NodeId }) {
  const [query, setQuery] = useState("");
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchesSearch = (definition: (typeof componentDefinitions)[number]) =>
    normalizedQuery.length === 0 ||
    definition.label.toLocaleLowerCase().includes(normalizedQuery) ||
    definition.type.toLocaleLowerCase().includes(normalizedQuery);

  const groups = [
    { label: "Common", definitions: componentDefinitions.filter(matchesSearch) },
    {
      label: "Layout",
      definitions: componentDefinitions.filter(
        (definition) => definition.category === "Layout" && matchesSearch(definition),
      ),
    },
  ].filter((group) => group.definitions.length > 0);

  async function addComponent(type: string) {
    setPendingType(type);
    setPersistenceError(null);

    try {
      const applied = await projectCommands.addComponent({ parentId, type });
      if (!applied) {
        const commandError = useProjectStore.getState().lastError;
        setPersistenceError(commandError?.message ?? "The component could not be added.");
      }
    } catch (cause: unknown) {
      setPersistenceError(
        cause instanceof Error ? cause.message : "The component could not be saved locally.",
      );
    } finally {
      setPendingType(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-4">
      <label className="relative block">
        <span className="sr-only">Search components</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search components..."
          className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </label>

      {groups.length > 0 ? (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <section key={group.label} aria-labelledby={`component-group-${group.label}`}>
              <h3
                id={`component-group-${group.label}`}
                className="mb-2.5 text-xs font-semibold text-foreground"
              >
                {group.label}
              </h3>

              <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                {group.definitions.map((definition) => {
                  const Icon = componentIcons[definition.icon] ?? Square;

                  return (
                    <button
                      key={`${group.label}-${definition.type}`}
                      type="button"
                      aria-label={`Add ${definition.label}`}
                      disabled={pendingType !== null}
                      onClick={() => void addComponent(definition.type)}
                      className="group flex min-w-0 flex-col items-center gap-1.5 text-center text-[10px] font-medium text-foreground-muted disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex h-11 w-full items-center justify-center rounded-lg border border-border/70 bg-surface-muted text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-colors group-hover:border-primary/40 group-hover:bg-primary-soft group-hover:text-primary">
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="w-full truncate">
                        {pendingType === definition.type ? "Adding…" : definition.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-foreground-muted">No components found.</p>
      )}

      {persistenceError ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {persistenceError}
        </p>
      ) : null}
    </div>
  );
}
