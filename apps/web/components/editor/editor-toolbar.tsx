"use client";

import { ArrowLeft, ChevronDown, Play, Save, Smartphone } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { Tooltip } from "@/components/ui/tooltip";

export type EditorSection = "design" | "preview";

/**
 * Top toolbar.
 *
 * Design and Preview switch presentation layouts inside the editor. Other future
 * sections remain disabled shell controls.
 */
export function EditorToolbar({
  projectName,
  activeSection,
  onSelectSection,
  onRenameProject,
}: {
  projectName: string;
  activeSection: EditorSection;
  onSelectSection: (section: EditorSection) => void;
  onRenameProject: (name: string) => Promise<boolean>;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(projectName);
  const [renameError, setRenameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(projectName);
    }
  }, [isEditingName, projectName]);

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  const startRenaming = () => {
    setDraftName(projectName);
    setRenameError(null);
    setIsEditingName(true);
  };

  const cancelRenaming = () => {
    setDraftName(projectName);
    setRenameError(null);
    setIsEditingName(false);
  };

  const commitRename = async () => {
    const name = draftName.trim();
    if (!name) {
      setRenameError("Project name must not be empty.");
      return;
    }

    try {
      const renamed = await onRenameProject(name);
      if (!renamed) {
        setRenameError("Project name could not be updated.");
        return;
      }

      setRenameError(null);
      setIsEditingName(false);
    } catch {
      setRenameError("Project name could not be saved.");
    }
  };

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelRenaming();
    }
  };

  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-border bg-background px-3 shadow-[0_1px_3px_rgba(16,24,40,0.03)]">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <ArrowLeft
            className="size-4 hover:text-primary transition-colors duration-200"
            aria-hidden
          />
        </Link>

        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <div
          className={`relative min-w-0 w-auto transition-[width] duration-200 ease-out ${
            isEditingName ? "max-w-44 " : "w-auto"
          }`}
        >
          {isEditingName ? (
            <input
              ref={nameInputRef}
              aria-label="Project name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={() => void commitRename()}
              className="border-0 bg-transparent px-2 py-1 text-sm font-medium outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startRenaming}
              className="max-w-56 truncate text-sm font-medium hover:bg-primary-soft hover:cursor-text px-2 py-1 transition-colors duration-200 ease-out rounded-lg"
            >
              {projectName}
            </button>
          )}
          <span
            aria-hidden
            className={`absolute inset-x-0 bottom-0 h-px origin-left bg-primary transition-transform duration-200 ease-out ${
              isEditingName ? "scale-x-100" : "scale-x-0"
            }`}
          />
          {renameError ? (
            <p
              role="alert"
              className="absolute left-2 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-background px-2 py-1 text-xs text-danger shadow-md"
            >
              {renameError}
            </p>
          ) : null}
        </div>

        <Tooltip content="Save project">
          <button
            type="button"
            aria-label="Save project"
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent text-foreground-muted transition-colors hover:border-border hover:bg-surface-muted hover:text-foreground"
          >
            <Save className="size-4" aria-hidden />
          </button>
        </Tooltip>
      </div>

      <nav
        aria-label="Editor sections"
        role="tablist"
        className="absolute left-[49.5%] top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-lg bg-surface-muted p-1"
      >
        <ToolbarSection
          active={activeSection === "design"}
          onSelect={() => onSelectSection("design")}
        >
          Design
        </ToolbarSection>
        <ToolbarSection>Navigate</ToolbarSection>
        <ToolbarSection
          active={activeSection === "preview"}
          onSelect={() => onSelectSection("preview")}
        >
          Preview
        </ToolbarSection>
        <ToolbarSection>Code</ToolbarSection>
        <ToolbarSection>Settings</ToolbarSection>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium xl:flex">
          <Smartphone className="size-3.5 text-foreground-muted" aria-hidden />
          Phone
          <ChevronDown className="size-3.5 text-foreground-muted" aria-hidden />
        </div>
        <button
          type="button"
          onClick={() => onSelectSection("preview")}
          className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(83,103,246,0.24)] transition-opacity hover:opacity-90"
        >
          <Play className="size-3.5" aria-hidden />
          Run
        </button>

        <button
          type="button"
          disabled
          className="hidden h-9 rounded-lg border border-border bg-background px-5 text-xs font-semibold text-foreground lg:block"
        >
          Publish
        </button>
      </div>
    </header>
  );
}

function ToolbarSection({
  children,
  active = false,
  onSelect,
}: {
  children: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      disabled={!onSelect}
      aria-selected={active}
      onClick={onSelect}
      className={
        active
          ? "rounded-md bg-primary-soft px-3 py-2 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          : "rounded-md px-3 py-2 text-xs font-medium text-foreground-muted transition-colors enabled:hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
