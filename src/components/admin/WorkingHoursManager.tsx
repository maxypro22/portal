"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock, Save } from "lucide-react";
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

export function WorkingHoursManager() {
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<DayRow[]>("/api/working-hours")
      .then(setDays)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load working hours"));
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<DayRow>) {
    setDays((prev) => prev && prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  async function save() {
    if (!days) return;
    setSaving(true);
    try {
      const updated = await apiFetch<DayRow[]>("/api/working-hours", {
        method: "PATCH",
        body: JSON.stringify({
          days: days.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            isOpen: d.isOpen,
            openMinutes: d.openMinutes,
            closeMinutes: d.closeMinutes,
          })),
        }),
      });
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

  if (!days) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
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
      <div className="flex items-center gap-3 sm:w-40 sm:shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={day.isOpen}
          onClick={() => onChange({ isOpen: !day.isOpen })}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            day.isOpen ? "bg-gold" : "bg-surface-border-strong"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              day.isOpen ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="font-serif text-base font-semibold text-content">{day.dayName}</span>
      </div>

      {day.isOpen ? (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-content-muted">
            <Clock className="h-4 w-4 text-gold/70" />
            Opens
            <input
              type="time"
              value={minutesToTime(day.openMinutes)}
              onChange={(e) => handleOpenChange(e.target.value)}
              className="input-base w-auto py-1.5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-content-muted">
            Closes
            <input
              type="time"
              value={minutesToTime(day.closeMinutes)}
              onChange={(e) => handleCloseChange(e.target.value)}
              className="input-base w-auto py-1.5"
            />
          </label>
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
