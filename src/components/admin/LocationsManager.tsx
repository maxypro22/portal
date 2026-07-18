"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, MapPin, Phone, Power } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  address: string;
  phone: string;
  imageUrl: string | null;
  isActive: boolean;
};

const EMPTY = { name: "", address: "", phone: "+974 ", imageUrl: "", isActive: true };

export function LocationsManager() {
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [editing, setEditing] = useState<Location | "new" | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Location[]>("/api/locations?all=1");
      setLocations(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load locations");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/locations/${deleting.id}`, { method: "DELETE" });
      toast.success("Location deleted");
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button onClick={() => setEditing("new")} className="btn-gold px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Add Location
        </button>
      </div>

      {!locations ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="No locations yet"
          description="Add your first branch to start taking reservations."
          action={
            <button onClick={() => setEditing("new")} className="btn-gold px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" /> Add Location
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {locations.map((loc) => (
            <div key={loc.id} className="card p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-content">{loc.name}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        loc.isActive
                          ? "border-status-confirmed/40 text-status-confirmed"
                          : "border-status-completed/40 text-status-completed"
                      )}
                    >
                      {loc.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-2 text-sm text-content-dim">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold/70" />
                    {loc.address}
                  </p>
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-content-dim">
                    <Phone className="h-4 w-4 text-gold/70" />
                    {loc.phone}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end border-t border-surface-border pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(loc)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border text-content-muted hover:border-gold hover:text-gold"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleting(loc)}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border text-content-muted hover:border-status-cancelled hover:text-status-cancelled"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <LocationForm
          location={editing === "new" ? null : editing}
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
        title="Delete location?"
        message={`This removes "${deleting?.name}" and all its tables. Locations with any booking history (past or upcoming) can't be deleted — set it to inactive instead to keep records intact.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
    </div>
  );
}

function LocationForm({
  location,
  onClose,
  onSaved,
}: {
  location: Location | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: location?.name ?? EMPTY.name,
    address: location?.address ?? EMPTY.address,
    phone: location?.phone ?? EMPTY.phone,
    imageUrl: location?.imageUrl ?? "",
    isActive: location?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null };
      if (location) {
        await apiFetch(`/api/locations/${location.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/locations", { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(location ? "Location updated" : "Location created");
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
      title={location ? "Edit Location" : "Add Location"}
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-gold px-5 py-2 text-sm">
            {saving ? "Saving…" : location ? "Save" : "Create"}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Labeled label="Name">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input-base" placeholder="Steak Town — Branch" />
        </Labeled>
        <Labeled label="Address">
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input-base" placeholder="Street, District, City" />
        </Labeled>
        <Labeled label="Phone">
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input-base" placeholder="+974 3XXX XXXX" />
        </Labeled>
        <Labeled label="Image URL (optional)">
          <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} className="input-base" placeholder="https://…" />
        </Labeled>
        <label className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => set("isActive", !form.isActive)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              form.isActive ? "bg-gold" : "bg-surface-border-strong"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                form.isActive ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
          <span className="flex items-center gap-1.5 text-sm text-content-muted">
            <Power className="h-4 w-4 text-gold/70" />
            {form.isActive ? "Active — visible to guests" : "Inactive — hidden"}
          </span>
        </label>
      </div>
    </Modal>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content-muted">{label}</span>
      {children}
    </label>
  );
}
