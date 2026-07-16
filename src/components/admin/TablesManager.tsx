"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, MapPin, Move } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { FloorPlan, type FloorTable } from "@/components/booking/FloorPlan";
import { EmptyState, Skeleton, StatusBadge } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { SECTIONS, TABLE_SHAPES, SECTION_META, type Section } from "@/lib/constants";
import { cn, seatLabel } from "@/lib/utils";

type LocationLite = { id: string; name: string };

export function TablesManager({ locations }: { locations: LocationLite[] }) {
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [tables, setTables] = useState<FloorTable[] | null>(null);
  const [editing, setEditing] = useState<FloorTable | "new" | null>(null);
  const [deleting, setDeleting] = useState<FloorTable | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!locationId) return;
    setTables(null);
    try {
      const data = await apiFetch<FloorTable[]>(
        `/api/tables?locationId=${locationId}&includeInactive=1`
      );
      setTables(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load tables");
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/tables/${deleting.id}`, { method: "DELETE" });
      toast.success(`Table ${deleting.number} deleted`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const nextNumber = tables ? Math.max(0, ...tables.map((t) => t.number)) + 1 : 1;

  return (
    <div>
      {/* Toolbar */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block sm:w-72">
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
        <button onClick={() => setEditing("new")} className="btn-gold px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Add Table
        </button>
      </div>

      {/* Floor preview */}
      <div className="card mb-6 p-6">
        <h2 className="mb-4 font-serif text-lg font-semibold text-cream">Floor Plan Preview</h2>
        {!tables ? (
          <Skeleton className="floorplan-canvas w-full rounded-2xl" />
        ) : tables.length === 0 ? (
          <EmptyState title="No tables on this floor" description="Add tables to build the layout." />
        ) : (
          <FloorPlan tables={tables} mode="view" />
        )}
      </div>

      {/* Table list */}
      {tables && tables.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-600/40 text-xs uppercase tracking-wide text-cream-dim">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Capacity</th>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">Shape</th>
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-600/30">
                {tables.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-950/30">
                    <td className="px-4 py-3 font-semibold text-gold">Table {t.number}</td>
                    <td className="px-4 py-3 text-cream-muted">{seatLabel(t.capacity)}</td>
                    <td className="px-4 py-3 text-cream-muted">
                      {SECTION_META[t.section as Section]?.label ?? t.section}
                    </td>
                    <td className="px-4 py-3 capitalize text-cream-muted">{t.shape}</td>
                    <td className="px-4 py-3 text-xs text-cream-dim">
                      {Math.round(t.posX)}, {Math.round(t.posY)}
                    </td>
                    <td className="px-4 py-3">
                      {t.isActive ? (
                        <StatusBadge status="CONFIRMED" />
                      ) : (
                        <span className="rounded-full border border-status-completed/40 px-2.5 py-1 text-xs text-status-completed">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(t)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-brand-600/60 text-cream-muted hover:border-gold hover:text-gold"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(t)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-brand-600/60 text-cream-muted hover:border-status-cancelled hover:text-status-cancelled"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <TableForm
          locationId={locationId}
          table={editing === "new" ? null : editing}
          defaultNumber={nextNumber}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Delete table?"
        message={`This removes Table ${deleting?.number}. Existing bookings for this table will also be removed.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
    </div>
  );
}

/* ------------------------------ Table form ----------------------------- */
function TableForm({
  locationId,
  table,
  defaultNumber,
  onClose,
  onSaved,
}: {
  locationId: string;
  table: FloorTable | null;
  defaultNumber: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    number: table?.number ?? defaultNumber,
    capacity: table?.capacity ?? 2,
    section: (table?.section as Section) ?? "MAIN",
    shape: table?.shape ?? "square",
    posX: table?.posX ?? 30,
    posY: table?.posY ?? 40,
    isActive: table?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, locationId };
      if (table) {
        await apiFetch(`/api/tables/${table.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/tables", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(table ? "Table updated" : "Table created");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={table ? `Edit Table ${table.number}` : "Add Table"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-gold px-5 py-2 text-sm">
            {saving ? "Saving…" : table ? "Save" : "Create"}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-4">
          <NumField label="Table Number" value={form.number} min={1} onChange={(v) => set("number", v)} />
          <NumField label="Capacity (seats)" value={form.capacity} min={1} max={20} onChange={(v) => set("capacity", v)} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-cream-muted">Section</span>
            <select
              value={form.section}
              onChange={(e) => set("section", e.target.value as Section)}
              className="input-base"
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {SECTION_META[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-cream-muted">Shape</span>
            <select
              value={form.shape}
              onChange={(e) => set("shape", e.target.value)}
              className="input-base capitalize"
            >
              {TABLE_SHAPES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => set("isActive", !form.isActive)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isActive ? "bg-gold" : "bg-brand-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  form.isActive ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-sm text-cream-muted">
              {form.isActive ? "Active — bookable" : "Inactive"}
            </span>
          </label>
        </div>

        {/* Position picker */}
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-muted">
            <Move className="h-4 w-4 text-gold/70" /> Position (click to place)
          </span>
          <PositionPicker
            posX={form.posX}
            posY={form.posY}
            label={String(form.number)}
            onChange={(x, y) => setForm((f) => ({ ...f, posX: x, posY: y }))}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <NumField label="X %" value={Math.round(form.posX)} min={0} max={100} onChange={(v) => set("posX", v)} />
            <NumField label="Y %" value={Math.round(form.posY)} min={0} max={100} onChange={(v) => set("posY", v)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** Click-to-place position picker mirroring the floor plan canvas. */
function PositionPicker({
  posX,
  posY,
  label,
  onChange,
}: {
  posX: number;
  posY: number;
  label: string;
  onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handle(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    onChange(x, y);
  }

  return (
    <div
      ref={ref}
      onClick={handle}
      className="floorplan-canvas relative w-full cursor-crosshair overflow-hidden rounded-xl border border-brand-600/50 bg-gradient-to-br from-brand-900 to-brand-950"
    >
      {/* Section guides */}
      <div className="absolute left-[4%] top-[4%] bottom-[4%] w-[44%] rounded-lg border border-brand-600/30 bg-brand-800/20" />
      <div className="absolute left-[54%] top-[4%] bottom-[4%] w-[18%] rounded-lg border border-brand-600/30 bg-brand-800/20" />
      <div className="absolute left-[76%] top-[4%] bottom-[4%] w-[20%] rounded-lg border border-brand-600/30 bg-brand-800/20" />
      {/* Marker */}
      <span
        className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-2 border-gold bg-gold-gradient text-xs font-bold text-brand-950 shadow-gold"
        style={{ left: `${posX}%`, top: `${posY}%` }}
      >
        {label}
      </span>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cream-muted">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-base"
      />
    </label>
  );
}
