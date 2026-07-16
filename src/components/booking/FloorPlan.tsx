"use client";

import { useMemo, useState } from "react";
import { cn, seatLabel } from "@/lib/utils";
import { SECTION_META, type Section } from "@/lib/constants";

export type FloorTable = {
  id: string;
  number: number;
  capacity: number;
  section: string;
  shape: string;
  posX: number;
  posY: number;
  isActive: boolean;
};

type FloorPlanProps = {
  tables: FloorTable[];
  selectedTableId?: string | null;
  unavailableTableIds?: Set<string>;
  /** Party size, to grey-out tables that are too small. */
  partySize?: number;
  /** view = read-only (admin live floor), select = interactive. */
  mode?: "select" | "view";
  onSelect?: (table: FloorTable) => void;
  className?: string;
};

/** Section background zones (percentages of the canvas). */
const SECTION_ZONES: Record<Section, { x: number; w: number; label: string }> = {
  MAIN: { x: 4, w: 44, label: "Main Hall" },
  TERRACE: { x: 54, w: 18, label: "Terrace" },
  VIP: { x: 76, w: 20, label: "VIP Booths" },
};

export function FloorPlan({
  tables,
  selectedTableId,
  unavailableTableIds,
  partySize,
  mode = "select",
  onSelect,
  className,
}: FloorPlanProps) {
  const [hovered, setHovered] = useState<FloorTable | null>(null);
  const unavailable = unavailableTableIds ?? new Set<string>();

  const sections = useMemo(() => {
    const present = new Set(tables.map((t) => t.section));
    return (Object.keys(SECTION_ZONES) as Section[]).filter((s) => present.has(s));
  }, [tables]);

  return (
    <div className={cn("w-full", className)}>
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-content-dim">
        <LegendDot className="border-2 border-gold bg-transparent" label="Available" />
        <LegendDot className="border-2 border-gold bg-gold-gradient" label="Selected" />
        <LegendDot className="border-2 border-surface-border-strong bg-surface-border opacity-50" label="Unavailable" />
        <LegendDot className="border border-dashed border-content-dim/40 bg-transparent" label="Too small" />
      </div>

      {/* Canvas */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-surface-raised to-surface-sunken shadow-card">
        <div className="floorplan-canvas relative w-full">
          {/* Section zones */}
          {sections.map((s) => {
            const zone = SECTION_ZONES[s];
            return (
              <div
                key={s}
                className="absolute top-[4%] bottom-[4%] rounded-xl border border-surface-border/30 bg-surface-bg/30"
                style={{ left: `${zone.x}%`, width: `${zone.w}%` }}
              >
                <span className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-luxe text-content-dim/70">
                  {SECTION_META[s].label}
                </span>
              </div>
            );
          })}

          {/* Decorative entrance marker */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-luxe text-content-dim/40">
            ▲ Entrance
          </div>

          {/* Tables */}
          {tables.map((table) => (
            <TableShape
              key={table.id}
              table={table}
              selected={selectedTableId === table.id}
              unavailable={unavailable.has(table.id) || !table.isActive}
              tooSmall={partySize !== undefined && table.capacity < partySize}
              mode={mode}
              onSelect={onSelect}
              onHover={setHovered}
            />
          ))}
        </div>
      </div>

      {/* Hover / selection detail */}
      <div className="mt-3 flex min-h-[1.5rem] items-center justify-center text-sm text-content-dim">
        {hovered ? (
          <span>
            <span className="font-semibold text-gold">Table {hovered.number}</span>
            {" · "}
            {seatLabel(hovered.capacity)}
            {" · "}
            {SECTION_META[hovered.section as Section]?.label ?? hovered.section}
          </span>
        ) : (
          <span className="text-content-dim/60">Hover a table to see details</span>
        )}
      </div>
    </div>
  );
}

/** A single positioned table with seat pips + state styling. */
function TableShape({
  table,
  selected,
  unavailable,
  tooSmall,
  mode,
  onSelect,
  onHover,
}: {
  table: FloorTable;
  selected: boolean;
  unavailable: boolean;
  tooSmall: boolean;
  mode: "select" | "view";
  onSelect?: (t: FloorTable) => void;
  onHover: (t: FloorTable | null) => void;
}) {
  const disabled = mode === "view" || unavailable || tooSmall;
  const isBooth = table.shape === "booth";
  const isRound = table.shape === "round";
  const isRect = table.shape === "rect";

  // Base size by shape (in canvas %), scaled a touch by capacity.
  const size = boothOrTableSize(table);

  const stateClass = selected
    ? "border-gold bg-gold-gradient text-brand-950 shadow-gold"
    : unavailable
      ? "border-surface-border-strong bg-surface-border/60 text-content-dim/50 opacity-60"
      : tooSmall
        ? "border-dashed border-content-dim/40 bg-surface-bg/40 text-content-dim/50"
        : "border-gold bg-surface-raised/70 text-content hover:bg-gold/15 hover:shadow-gold";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect?.(table)}
      onMouseEnter={() => onHover(table)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(table)}
      onBlur={() => onHover(null)}
      aria-label={`Table ${table.number}, seats ${table.capacity}${
        unavailable ? ", unavailable" : ""
      }`}
      aria-pressed={selected}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-1/2 select-none transition-all duration-200",
        !disabled && "cursor-pointer hover:z-20 hover:scale-110",
        disabled && "cursor-not-allowed"
      )}
      style={{
        left: `${table.posX}%`,
        top: `${table.posY}%`,
        width: `${size.w}%`,
        height: `${size.h}%`,
      }}
    >
      {/* Seat pips */}
      <SeatPips capacity={table.capacity} shape={table.shape} dim={disabled} selected={selected} />

      {/* Table body */}
      <span
        className={cn(
          "relative z-10 flex h-full w-full items-center justify-center border-2 font-semibold transition-all duration-200",
          isRound ? "rounded-full" : isBooth ? "rounded-2xl" : isRect ? "rounded-lg" : "rounded-lg",
          stateClass
        )}
      >
        <span className={cn("text-[clamp(9px,1.4vw,15px)]", unavailable && "line-through")}>
          {table.number}
        </span>
      </span>
    </button>
  );
}

/** Seat indicator pips distributed around the table shape. */
function SeatPips({
  capacity,
  shape,
  dim,
  selected,
}: {
  capacity: number;
  shape: string;
  dim?: boolean;
  selected?: boolean;
}) {
  const color = selected ? "bg-gold-dark" : dim ? "bg-surface-border-strong" : "bg-gold/70";

  if (shape === "round") {
    // Distribute pips evenly around a circle.
    return (
      <>
        {Array.from({ length: capacity }).map((_, i) => {
          const angle = (i / capacity) * Math.PI * 2 - Math.PI / 2;
          const r = 62; // % radius from centre
          const x = 50 + Math.cos(angle) * r;
          const y = 50 + Math.sin(angle) * r;
          return (
            <span
              key={i}
              className={cn("absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full", color)}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          );
        })}
      </>
    );
  }

  // Rect / square / booth: split across top & bottom edges.
  const top = Math.ceil(capacity / 2);
  const bottom = capacity - top;
  const row = (count: number, edge: "top" | "bottom") =>
    Array.from({ length: count }).map((_, i) => {
      const x = ((i + 1) / (count + 1)) * 100;
      return (
        <span
          key={`${edge}-${i}`}
          className={cn(
            "absolute h-1.5 w-2.5 -translate-x-1/2 rounded-sm",
            color,
            edge === "top" ? "-top-1" : "-bottom-1"
          )}
          style={{ left: `${x}%` }}
        />
      );
    });

  return (
    <>
      {row(top, "top")}
      {row(bottom, "bottom")}
    </>
  );
}

/** Size heuristics so bigger tables read as bigger. */
function boothOrTableSize(table: FloorTable): { w: number; h: number } {
  if (table.shape === "booth") return { w: 12, h: 9 };
  if (table.shape === "rect") return { w: 11, h: 7 };
  if (table.capacity >= 6) return { w: 9, h: 9 };
  if (table.capacity >= 4) return { w: 8, h: 8 };
  return { w: 6.5, h: 6.5 };
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded", className)} />
      {label}
    </span>
  );
}
