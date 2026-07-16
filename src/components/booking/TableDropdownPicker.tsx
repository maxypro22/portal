"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Ban, Check } from "lucide-react";
import type { FloorTable } from "./FloorPlan";
import { SECTION_META, SECTIONS, type Section } from "@/lib/constants";
import { cn, seatLabel } from "@/lib/utils";

/**
 * Mobile-friendly table picker: pick a section (Main Hall / Terrace / VIP)
 * as a 3-way tab, then choose a specific table from a dropdown listing that
 * section's tables — used in place of the visual floor plan on small screens,
 * where tapping precise coordinates on a map is fiddly.
 */
export function TableDropdownPicker({
  tables,
  selectedTableId,
  unavailableTableIds,
  partySize,
  onSelect,
}: {
  tables: FloorTable[];
  selectedTableId?: string | null;
  unavailableTableIds?: Set<string>;
  partySize?: number;
  onSelect?: (t: FloorTable) => void;
}) {
  const unavailable = unavailableTableIds ?? new Set<string>();
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  const sectionsPresent = useMemo(
    () => (SECTIONS as readonly Section[]).filter((s) => tables.some((t) => t.section === s)),
    [tables]
  );

  const [activeSection, setActiveSection] = useState<Section>(
    () => (selectedTable?.section as Section) ?? sectionsPresent[0] ?? "MAIN"
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const sectionTables = tables
    .filter((t) => t.section === activeSection)
    .sort((a, b) => a.number - b.number);

  // Tailwind needs literal class strings — can't interpolate `grid-cols-${n}`.
  const tabGridClass =
    { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" }[sectionsPresent.length] ?? "grid-cols-3";

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className={cn("grid gap-2", tabGridClass)}>
        {sectionsPresent.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setActiveSection(s);
              setOpen(false);
            }}
            className={cn(
              "rounded-xl border-2 px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-all",
              activeSection === s
                ? "border-gold bg-gold/10 text-gold"
                : "border-surface-border text-content-dim hover:border-gold/40"
            )}
          >
            {SECTION_META[s].label}
          </button>
        ))}
      </div>

      {/* Table dropdown within the active section */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="input-base flex items-center justify-between text-left"
          aria-expanded={open}
        >
          <span className={selectedTable && selectedTable.section === activeSection ? "text-content" : "text-content-dim"}>
            {selectedTable && selectedTable.section === activeSection
              ? `Table ${selectedTable.number} · ${seatLabel(selectedTable.capacity)}`
              : `Select a table — ${SECTION_META[activeSection].label}`}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-gold transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-surface-border bg-surface-raised shadow-card-hover">
            {sectionTables.length === 0 && (
              <p className="p-4 text-sm text-content-dim">No tables in this section.</p>
            )}
            {sectionTables.map((table) => {
              const isUnavailable = unavailable.has(table.id) || !table.isActive;
              const tooSmall = partySize !== undefined && table.capacity < partySize;
              const disabled = isUnavailable || tooSmall;
              const active = table.id === selectedTableId;

              return (
                <button
                  key={table.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect?.(table);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-sm transition-colors",
                    active
                      ? "bg-gold/15 text-gold"
                      : disabled
                        ? "cursor-not-allowed text-content-dim/40 line-through"
                        : "text-content-muted hover:bg-surface-sunken hover:text-content"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {active && <Check className="h-3.5 w-3.5" />}
                    Table {table.number}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    {isUnavailable && <Ban className="h-3 w-3" />}
                    {seatLabel(table.capacity)}
                    {tooSmall && !isUnavailable && " · too small"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
