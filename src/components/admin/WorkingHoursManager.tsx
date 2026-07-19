"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Clock, Save, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { cn, minutesToTime, timeToMinutes } from "@/lib/utils";

type DayRow = {
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openMinutes: number;
  closeMinutes: number;
};

const LAST_SEATING_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

export function WorkingHoursManager() {
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [lastSeatingBuffer, setLastSeatingBuffer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<DayRow[]>("/api/working-hours")
      .then(setDays)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load working hours"));
    apiFetch<{ lastSeatingBufferMinutes: number }>("/api/booking-settings")
      .then((s) => setLastSeatingBuffer(s.lastSeatingBufferMinutes))
      .catch(() => setLastSeatingBuffer(30));
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<DayRow>) {
    setDays((prev) => prev && prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  async function save() {
    if (!days) return;
    setSaving(true);
    try {
      const [updated] = await Promise.all([
        apiFetch<DayRow[]>("/api/working-hours", {
          method: "PATCH",
          body: JSON.stringify({
            days: days.map((d) => ({
              dayOfWeek: d.dayOfWeek,
              isOpen: d.isOpen,
              openMinutes: d.openMinutes,
              closeMinutes: d.closeMinutes,
            })),
          }),
        }),
        lastSeatingBuffer != null
          ? apiFetch("/api/booking-settings", {
              method: "PATCH",
              body: JSON.stringify({ lastSeatingBufferMinutes: lastSeatingBuffer }),
            })
          : Promise.resolve(),
      ]);
      setDays((prev) =>
        prev?.map((d) => {
          const fresh = updated.find((u) => u.dayOfWeek === d.dayOfWeek);
          return fresh ? { ...d, ...fresh } : d;
        }) ?? prev
      );
      toast.success("Working hours updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!days || lastSeatingBuffer == null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/5 text-gold">
            <Timer className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-serif text-base font-semibold text-content">Last Seating Before Closing</p>
            <p className="text-xs text-content-dim">
              How close to closing time the last bookable slot sits — doesn&apos;t change the
              spacing between the other times.
            </p>
          </div>
        </div>
        <select
          value={lastSeatingBuffer}
          onChange={(e) => setLastSeatingBuffer(Number(e.target.value))}
          className="input-base w-auto py-2"
        >
          {LAST_SEATING_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m === 0 ? "Right up to closing time" : `${m} minutes before close`}
            </option>
          ))}
        </select>
      </div>

      <div className="card divide-y divide-surface-border overflow-hidden">
        {days.map((day) => (
          <DayRowEditor key={day.dayOfWeek} day={day} onChange={(patch) => updateDay(day.dayOfWeek, patch)} />
        ))}

        <div className="flex justify-end bg-surface-sunken/30 px-5 py-4">
          <button onClick={save} disabled={saving} className="btn-gold px-6 py-2.5 text-sm">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DayRowEditor({
  day,
  onChange,
}: {
  day: DayRow;
  onChange: (patch: Partial<DayRow>) => void;
}) {
  // If the closing time is at or before the opening time, it's understood
  // to fall after midnight (e.g. 12:00 PM - 1:00 AM) — no separate "next
  // day" toggle needed, this is auto-detected on save.
  function handleCloseChange(timeValue: string) {
    const openM = day.openMinutes;
    let closeM = timeToMinutes(timeValue);
    if (closeM <= openM % 1440) closeM += 1440;
    onChange({ closeMinutes: closeM });
  }

  function handleOpenChange(timeValue: string) {
    const openM = timeToMinutes(timeValue);
    let closeM = day.closeMinutes;
    // Re-evaluate whether close still needs to wrap past midnight.
    const closeTimeOnly = closeM % 1440;
    closeM = closeTimeOnly <= openM ? closeTimeOnly + 1440 : closeTimeOnly;
    onChange({ openMinutes: openM, closeMinutes: closeM });
  }

  return (
    <div className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center", !day.isOpen && "opacity-60")}>
      <div className="flex items-center gap-4 sm:w-44 sm:shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={day.isOpen}
          onClick={() => onChange({ isOpen: !day.isOpen })}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            day.isOpen ? "bg-gold" : "bg-surface-border-strong"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              day.isOpen ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="truncate font-serif text-base font-semibold text-content">{day.dayName}</span>
      </div>

      {day.isOpen ? (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <TimeField
            label="Opens"
            icon={<Clock className="h-4 w-4 text-gold/70" />}
            value={minutesToTime(day.openMinutes)}
            onChange={handleOpenChange}
          />
          <TimeField label="Closes" value={minutesToTime(day.closeMinutes)} onChange={handleCloseChange} />
          {day.closeMinutes > 1440 && (
            <span className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs text-gold">
              past midnight
            </span>
          )}
        </div>
      ) : (
        <span className="flex-1 text-sm text-content-dim">Closed all day</span>
      )}
    </div>
  );
}

/**
 * A time field where clicking anywhere in the pill — the label text, the
 * icon, or the border around the value — opens the picker, not just the
 * native input's own tiny click target. showPicker() is a modern browser
 * API (Chrome/Edge/recent Firefox/Safari); where unsupported it's just a
 * no-op and the normal label-click-to-focus behavior still applies.
 */
function TimeField({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    inputRef.current?.focus();
    inputRef.current?.showPicker?.();
  }

  return (
    <div
      onClick={openPicker}
      className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-border bg-surface-sunken px-3.5 py-2 text-sm text-content-muted transition-colors hover:border-gold/50"
    >
      {icon}
      {label}
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="w-auto border-0 bg-transparent p-0 text-content focus:outline-none"
      />
    </div>
  );
}
