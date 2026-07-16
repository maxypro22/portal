"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  MoreVertical,
  Check,
  X,
  CheckCheck,
  UserX,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarX,
  RotateCcw,
} from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { StatusBadge, EmptyState, Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { BOOKING_STATUSES, STATUS_META, type BookingStatus } from "@/lib/constants";
import { cn, formatTime12h, toDateKey } from "@/lib/utils";

type LocationLite = { id: string; name: string };
type Booking = {
  id: string;
  reference: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  specialRequests: string | null;
  location: { id: string; name: string };
  table: { id: string; number: number; capacity: number; section: string };
};
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

export function BookingsManager({ locations }: { locations: LocationLite[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<{ bookings: Booking[]; pagination: Pagination } | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (locationId) p.set("locationId", locationId);
    if (date) p.set("date", date);
    p.set("page", String(page));
    p.set("pageSize", "10");
    return p.toString();
  }, [q, status, locationId, date, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ bookings: Booking[]; pagination: Pagination }>(
        `/api/bookings?${query}`
      );
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Debounce fetches so typing in search doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Reset to page 1 when filters (not page) change.
  useEffect(() => {
    setPage(1);
  }, [q, status, locationId, date]);

  async function changeStatus(b: Booking, next: BookingStatus) {
    setBusyId(b.id);
    try {
      await apiFetch(`/api/bookings/${b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(`Marked ${STATUS_META[next].label}`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await apiFetch(`/api/bookings/${deleting.id}`, { method: "DELETE" });
      toast.success("Booking deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const hasFilters = q || status || locationId || date;
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setLocationId("");
    setDate("");
  };

  return (
    <div>
      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, reference…"
              className="input-base pl-10"
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-base">
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>

          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="input-base"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base"
            />
            {hasFilters && (
              <button
                onClick={clearFilters}
                title="Clear filters"
                className="grid w-11 shrink-0 place-items-center rounded-xl border border-brand-600/60 text-cream-dim hover:border-gold hover:text-gold"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : data && data.bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="h-8 w-8" />}
            title="No bookings found"
            description={
              hasFilters
                ? "Try adjusting or clearing your filters."
                : "New reservations will appear here."
            }
            action={
              hasFilters ? (
                <button onClick={clearFilters} className="btn-ghost px-4 py-2 text-sm">
                  Clear filters
                </button>
              ) : undefined
            }
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-brand-600/40 text-xs uppercase tracking-wide text-cream-dim">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Table</th>
                  <th className="px-4 py-3 font-semibold">Date &amp; Time</th>
                  <th className="px-4 py-3 font-semibold">Party</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-brand-600/30", loading && "opacity-50")}>
                {data?.bookings.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-brand-950/30">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gold">
                        {b.reference}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-cream">{b.guestName}</p>
                      <p className="text-xs text-cream-dim">{b.guestPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-cream-muted">{b.location.name}</td>
                    <td className="px-4 py-3 text-cream-muted">
                      #{b.table.number}
                      <span className="ml-1 text-xs text-cream-dim">({b.table.section})</span>
                    </td>
                    <td className="px-4 py-3 text-cream-muted">
                      <p>{new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</p>
                      <p className="text-xs text-cream-dim">{formatTime12h(b.timeSlot)}</p>
                    </td>
                    <td className="px-4 py-3 text-cream-muted">{b.partySize}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActions
                          booking={b}
                          busy={busyId === b.id}
                          onStatus={(s) => changeStatus(b, s)}
                          onEdit={() => setEditing(b)}
                          onDelete={() => setDeleting(b)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.bookings.length > 0 && (
          <div className="flex items-center justify-between border-t border-brand-600/40 px-4 py-3 text-sm text-cream-dim">
            <span>
              {(data.pagination.page - 1) * data.pagination.pageSize + 1}–
              {Math.min(
                data.pagination.page * data.pagination.pageSize,
                data.pagination.total
              )}{" "}
              of {data.pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.pagination.page <= 1}
                className="grid h-9 w-9 place-items-center rounded-lg border border-brand-600/60 disabled:opacity-40 hover:border-gold hover:text-gold"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="grid h-9 w-9 place-items-center rounded-lg border border-brand-600/60 disabled:opacity-40 hover:border-gold hover:text-gold"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Delete booking?"
        message={`This permanently removes ${deleting?.reference} for ${deleting?.guestName}. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={busyId === deleting?.id}
      />
    </div>
  );
}

/* --------------------------- Row action menu --------------------------- */
function RowActions({
  booking,
  busy,
  onStatus,
  onEdit,
  onDelete,
}: {
  booking: Booking;
  busy: boolean;
  onStatus: (s: BookingStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [
    {
      label: "Confirm",
      icon: <Check className="h-4 w-4" />,
      onClick: () => onStatus("CONFIRMED"),
    },
    {
      label: "Mark Completed",
      icon: <CheckCheck className="h-4 w-4" />,
      onClick: () => onStatus("COMPLETED"),
    },
    { label: "No-show", icon: <UserX className="h-4 w-4" />, onClick: () => onStatus("NO_SHOW") },
    { label: "Cancel", icon: <X className="h-4 w-4" />, onClick: () => onStatus("CANCELLED") },
    { label: "Edit", icon: <Pencil className="h-4 w-4" />, onClick: onEdit },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: onDelete, danger: true },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-label="Booking actions"
        className="grid h-9 w-9 place-items-center rounded-lg border border-brand-600/60 text-cream-muted transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-brand-600/60 bg-brand-900 py-1 shadow-card-hover">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors",
                  it.danger
                    ? "text-status-cancelled hover:bg-status-cancelled/10"
                    : "text-cream-muted hover:bg-brand-800 hover:text-cream"
                )}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------- Edit booking modal ------------------------ */
function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    guestEmail: booking.guestEmail,
    partySize: booking.partySize,
    date: toDateKey(new Date(booking.date)),
    timeSlot: booking.timeSlot,
    status: booking.status,
    specialRequests: booking.specialRequests ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          guestName: form.guestName,
          guestPhone: form.guestPhone,
          guestEmail: form.guestEmail,
          partySize: Number(form.partySize),
          date: form.date,
          timeSlot: form.timeSlot,
          status: form.status,
          specialRequests: form.specialRequests || null,
        }),
      });
      toast.success("Booking updated");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${booking.reference}`}
      description={`Table ${booking.table.number} · ${booking.location.name}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-gold px-5 py-2 text-sm">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledInput label="Full Name" value={form.guestName} onChange={(v) => set("guestName", v)} />
        <LabeledInput label="Phone" value={form.guestPhone} onChange={(v) => set("guestPhone", v)} />
        <div className="sm:col-span-2">
          <LabeledInput label="Email" value={form.guestEmail} onChange={(v) => set("guestEmail", v)} />
        </div>
        <LabeledInput
          label="Party Size"
          type="number"
          value={String(form.partySize)}
          onChange={(v) => set("partySize", Number(v) as never)}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-cream-muted">Status</span>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as BookingStatus)}
            className="input-base"
          >
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <LabeledInput
          label="Date"
          type="date"
          value={form.date}
          onChange={(v) => set("date", v)}
        />
        <LabeledInput
          label="Time (HH:mm)"
          value={form.timeSlot}
          onChange={(v) => set("timeSlot", v)}
        />
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-cream-muted">Special Requests</span>
          <textarea
            value={form.specialRequests}
            onChange={(e) => set("specialRequests", e.target.value)}
            rows={2}
            className="input-base resize-none"
          />
        </div>
      </div>
      <p className="mt-4 text-xs text-cream-dim/70">
        Changing table, date, or time re-checks availability to prevent double-booking.
      </p>
    </Modal>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-cream-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
    </label>
  );
}
