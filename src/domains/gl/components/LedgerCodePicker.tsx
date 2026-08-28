import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  TreePine,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/useApiQuery";
import { glService } from "@/domains/gl/services/glService";
import type { LedgerReference } from "@/domains/gl/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

export interface LedgerCodePickerProps {
  /** Currently selected ledger code. */
  value: string;
  /** Called when the user picks a code or clears the selection. */
  onChange: (code: string, ref: LedgerReference | null) => void;
  /** Disable the entire control. */
  disabled?: boolean;
  /** Show an error message below the picker. */
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Leaf badge                                                        */
/* ------------------------------------------------------------------ */

function LeafBadge({ leaf }: { leaf?: string }) {
  const isLeaf = leaf?.toUpperCase() === "Y";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        isLeaf
          ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60"
          : "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/60",
      )}
    >
      {isLeaf ? <TreePine className="size-3" /> : <FileText className="size-3" />}
      {isLeaf ? "Leaf" : "Header"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function LedgerCodePicker({
  value,
  onChange,
  disabled = false,
  error,
}: LedgerCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* ---- Fetch all references ---- */
  const { data: references = [], isLoading } = useApiQuery(
    "gl:reference-data",
    () => glService.getReferenceData(),
  );

  /* ---- Filtered list ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return references;
    return references.filter(
      (r) =>
        r.glCode?.toLowerCase().includes(q) ||
        r.glDesc?.toLowerCase().includes(q),
    );
  }, [references, query]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filtered, safePage],
  );

  /* ---- Reset page & highlight when results change ---- */
  useEffect(() => {
    setPage(0);
    setHighlightIndex(0);
  }, [filtered.length, query]);

  /* ---- Position dropdown below trigger ---- */
  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    let top = rect.bottom + margin;
    let left = rect.left;
    const width = rect.width;
    if (top + 380 > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - 380 - margin);
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    setPosition({ top, left, width });
  }, []);

  /* ---- Open / close ---- */
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    updatePosition();
    setQuery("");
    setPage(0);
  }, [disabled, updatePosition]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightIndex(0);
    setPage(0);
  }, []);

  /* ---- Select an option ---- */
  const selectOption = useCallback(
    (ref: LedgerReference) => {
      onChange(ref.glCode, ref);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  /* ---- Clear selection ---- */
  const clearSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("", null);
    },
    [onChange],
  );

  /* ---- Navigate to the page that contains a given global index ---- */
  const navigateToGlobalIndex = useCallback(
    (globalIdx: number) => {
      setPage(Math.floor(globalIdx / PAGE_SIZE));
      setHighlightIndex(globalIdx % PAGE_SIZE);
    },
    [],
  );

  /* ---- Global listeners when open ---- */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDropdown();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        // Navigate within the full filtered list, auto-paging
        const globalIdx = safePage * PAGE_SIZE + highlightIndex;
        if (globalIdx < filtered.length - 1) {
          const nextGlobal = globalIdx + 1;
          navigateToGlobalIndex(nextGlobal);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const globalIdx = safePage * PAGE_SIZE + highlightIndex;
        if (globalIdx > 0) {
          const prevGlobal = globalIdx - 1;
          navigateToGlobalIndex(prevGlobal);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pagedItems[highlightIndex]) {
          selectOption(pagedItems[highlightIndex]);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    open,
    filtered,
    pagedItems,
    highlightIndex,
    safePage,
    closeDropdown,
    selectOption,
    navigateToGlobalIndex,
  ]);

  /* ---- Scroll highlighted item into view (only within the list container) ---- */
  useEffect(() => {
    const el = optionRefs.current[highlightIndex];
    if (el && listRef.current) {
      // Only scroll within the list container, not the window
      const container = listRef.current;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      if (elTop < container.scrollTop) {
        container.scrollTop = elTop;
      } else if (elBottom > container.scrollTop + container.clientHeight) {
        container.scrollTop = elBottom - container.clientHeight;
      }
    }
  }, [highlightIndex]);

  /* ---- Re-position on resize ---- */
  useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [open, updatePosition]);

  /* ---- Focus search input when opened ---- */
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  /* ---- Find currently selected reference for display ---- */
  const selectedRef = useMemo(
    () => references.find((r) => r.glCode === value) ?? null,
    [references, value],
  );

  /* ---- Pagination range display ---- */
  const rangeStart = safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

  return (
    <>
      {/* ---- Trigger button ---- */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        className={cn(
          "group flex h-11 w-full items-center gap-2 rounded-xl border-2 bg-white px-3.5 text-left text-base transition-all",
          "outline-none focus-visible:ring-3 focus-visible:ring-indigo-100",
          disabled && "cursor-not-allowed opacity-50",
          error
            ? "border-red-300 focus-visible:border-red-400"
            : "border-neutral-200 hover:border-indigo-300 focus-visible:border-indigo-400",
        )}
      >
        {selectedRef ? (
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
              {selectedRef.glCode.slice(0, 3)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm font-semibold text-indigo-700">
                {selectedRef.glCode}
              </div>
              <div className="truncate text-xs text-neutral-500">
                {selectedRef.glDesc}
              </div>
            </div>
            <LeafBadge leaf={selectedRef.leaf} />
          </div>
        ) : (
          <span className="flex-1 text-neutral-400">Select a ledger code…</span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-neutral-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* ---- Dropdown ---- */}
      {open &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 slide-in-from-top-2"
          >
            {/* Search header */}
            <div className="border-b border-neutral-100 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 px-3 py-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-indigo-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by code or description…"
                  className="h-9 w-full rounded-lg border-2 border-indigo-200 bg-white pl-8 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between px-0.5">
                <span className="text-[11px] font-medium text-neutral-400">
                  {isLoading
                    ? "Loading codes…"
                    : filtered.length === 0
                      ? "No codes found"
                      : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} code${filtered.length !== 1 ? "s" : ""}`}
                </span>
                {selectedRef && (
                  <button
                    type="button"
                    onClick={(e) => {
                      clearSelection(e);
                      closeDropdown();
                    }}
                    className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div ref={listRef} className="max-h-72 overflow-y-auto p-1.5">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
                  <Loader2 className="size-4 animate-spin" />
                  Loading reference codes…
                </div>
              ) : pagedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <AlertCircle className="size-8 text-neutral-300" />
                  <p className="text-sm font-medium text-neutral-500">
                    No matching codes found
                  </p>
                  <p className="text-xs text-neutral-400">
                    Try a different search term
                  </p>
                </div>
              ) : (
                pagedItems.map((ref, idx) => {
                  const isSelected = ref.glCode === value;
                  const isHighlighted = idx === highlightIndex;

                  return (
                    <button
                      key={ref.glCode}
                      ref={(el) => {
                        optionRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(ref)}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                        isHighlighted && "bg-indigo-50",
                        isSelected && "bg-indigo-100/70",
                        !isHighlighted && !isSelected && "hover:bg-neutral-50",
                      )}
                    >
                      {/* Code badge */}
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm transition-transform",
                          isHighlighted && "scale-105",
                          isSelected
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600"
                            : "bg-gradient-to-br from-indigo-400 to-purple-500",
                        )}
                      >
                        {ref.glCode.slice(0, 3)}
                      </span>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-neutral-900">
                            {ref.glCode}
                          </span>
                          <LeafBadge leaf={ref.leaf} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {ref.glDesc || "No description"}
                        </p>
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-indigo-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with pagination controls */}
            <div className="border-t border-neutral-100 bg-neutral-50/80 px-3 py-2">
              <div className="flex items-center justify-between">
                {/* Keyboard hints */}
                <p className="text-[11px] text-neutral-400">
                  ↑↓ navigate · ↵ select · esc close
                </p>

                {/* Pagination buttons */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePage === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPage((p) => Math.max(0, p - 1));
                        setHighlightIndex(0);
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                        safePage === 0
                          ? "cursor-not-allowed text-neutral-300"
                          : "text-indigo-600 hover:bg-indigo-100",
                      )}
                    >
                      <ChevronLeft className="size-3" />
                      Prev
                    </button>
                    <span className="text-[11px] font-medium text-neutral-500 tabular-nums">
                      {safePage + 1} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPage((p) => Math.min(totalPages - 1, p + 1));
                        setHighlightIndex(0);
                      }}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                        safePage >= totalPages - 1
                          ? "cursor-not-allowed text-neutral-300"
                          : "text-indigo-600 hover:bg-indigo-100",
                      )}
                    >
                      Next
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
