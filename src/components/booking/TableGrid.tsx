"use client";

import { Users, Check, Ban } from "lucide-react";
import type { FloorTable } from "./FloorPlan";
import { SECTION_META, SECTIONS, type Section } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Mobile-friendly table picker: tables grouped into sections (Main Hall /
 * Terrace / VIP) as large, tappable cards. Used on small screens where the
 * visual floor plan would be too cramped to tap accurately.
 */
export function TableGrid({
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

  return (
    <div className="space-y-6">
      {(SECTIONS as readonly Section[]).map((section) => {
        const sectionTables = tables
          .filter((t) => t.section === section)
          .sort((a, b) => a.number - b.number);
        if (sectionTables.length === 0) return null;

        return (
          <div key={section}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-luxe text-gold">
                {SECTION_META[section].label}
              </h3>
              <span className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
            </div>

            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
              {sectionTables.map((table) => {
                const isUnavailable = unavailable.has(table.id) || !table.isActive;
                const tooSmall = partySize !== undefined && table.capacity < partySize;
                const disabled = isUnavailable || tooSmall;
                const selected = selectedTableId === table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onSelect?.(table)}
                    aria-pressed={selected}
                    aria-label={`Table ${table.number}, seats ${table.capacity}${
                      isUnavailable ? ", unavailable" : ""
                    }`}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition-all duration-200 active:scale-95",
                      selected
                        ? "border-gold bg-gold-gradient text-brand-950 shadow-gold"
                        : isUnavailable
                          ? "cursor-not-allowed border-brand-700 bg-brand-900/50 text-cream-dim/40"
                          : tooSmall
                            ? "cursor-not-allowed border-dashed border-cream-dim/30 bg-brand-900/40 text-cream-dim/40"
                            : "border-gold/60 bg-brand-900/70 text-cream hover:border-gold hover:bg-gold/10"
                    )}
                  >
                    {selected && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-950 text-gold">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                      Table
                    </span>
                    <span className={cn("font-serif text-xl font-bold leading-none", isUnavailable && "line-through")}>
                      {table.number}
                    </span>
                    <span className="mt-0.5 flex items-center gap-0.5 text-[11px]">
                      {isUnavailable ? (
                        <Ban className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )}
                      {table.capacity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
