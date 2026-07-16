"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Clock, MapPin, RefreshCw } from "lucide-react";
import { FloorPlan, type FloorTable } from "@/components/booking/FloorPlan";
import { Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { generateSlotsForDay, formatTime12h, fromDateKey, toDateKey } from "@/lib/utils";

type LocationLite = { id: string; name: string };

export function LiveFloor({ locations }: { locations: LocationLite[] }) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [timeSlot, setTimeSlot] = useState("19:00");

  const [tables, setTables] = useState<FloorTable[] | null>(null);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const slots = useMemo(() => {
    const d = fromDateKey(date);
    return generateSlotsForDay(d.getDay());
  }, [date]);

  // Keep the selected time valid for the chosen day.
  useEffect(() => {
    if (slots.length && !slots.includes(timeSlot)) setTimeSlot(slots[Math.floor(slots.length / 3)]);
  }, [slots, timeSlot]);

  const load = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    try {
      const [tbls, avail] = await Promise.all([
        apiFetch<FloorTable[]>(`/api/tables?locationId=${locationId}&includeInactive=1`),
        apiFetch<{ unavailableTableIds: string[] }>(
          `/api/availability?locationId=${locationId}&date=${date}&timeSlot=${timeSlot}`
        ),
      ]);
      setTables(tbls);
      setUnavailable(new Set(avail.unavailableTableIds));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load floor");
    } finally {
      setLoading(false);
    }
  }, [locationId, date, timeSlot]);

  useEffect(() => {
    load();
  }, [load]);

  const total = tables?.filter((t) => t.isActive).length ?? 0;
  const occupied = tables ? tables.filter((t) => unavailable.has(t.id)).length : 0;
  const free = Math.max(0, total - occupied);

  return (
    <div>
      {/* Controls */}
      <div className="card mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-dim">
              <MapPin className="h-3.5 w-3.5" /> Location
            </span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="input-base"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-dim">
              <CalendarDays className="h-3.5 w-3.5" /> Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-dim">
              <Clock className="h-3.5 w-3.5" /> Time
            </span>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="input-base"
              disabled={!slots.length}
            >
              {slots.length === 0 && <option>Closed</option>}
              {slots.map((s) => (
                <option key={s} value={s}>
                  {formatTime12h(s)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button onClick={load} className="btn-ghost w-full px-4 py-3 text-sm">
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Chip label="Occupied" value={occupied} className="text-status-cancelled" />
          <Chip label="Available" value={free} className="text-status-confirmed" />
          <Chip label="Total (active)" value={total} className="text-gold" />
        </div>
      </div>

      {/* Floor */}
      <div className="card p-6">
        {!tables ? (
          <Skeleton className="floorplan-canvas w-full rounded-2xl" />
        ) : (
          <FloorPlan tables={tables} unavailableTableIds={unavailable} mode="view" />
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/60 bg-brand-950/40 px-3 py-1.5">
      <span className={`font-serif text-lg font-bold ${className ?? ""}`}>{value}</span>
      <span className="text-xs text-cream-dim">{label}</span>
    </span>
  );
}
