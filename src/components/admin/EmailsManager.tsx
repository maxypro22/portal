"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Mail } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";

type NotificationEmail = { id: string; email: string; label: string | null; createdAt: string };

export function EmailsManager() {
  const [emails, setEmails] = useState<NotificationEmail[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<NotificationEmail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<NotificationEmail[]>("/api/notification-emails");
      setEmails(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load emails");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/notification-emails/${deleting.id}`, { method: "DELETE" });
      toast.success("Email removed");
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
      <p className="mb-6 max-w-2xl text-sm text-content-dim">
        Every address below gets a copy of the booking-confirmation email as soon as a guest
        reserves — in addition to the guest&apos;s own email, if they gave one.
      </p>

      <div className="mb-6 flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-gold px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Add Email
        </button>
      </div>

      {!emails ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : emails.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8" />}
          title="No notification emails yet"
          description="Add the owner's or manager's email to receive every booking."
          action={
            <button onClick={() => setAdding(true)} className="btn-gold px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" /> Add Email
            </button>
          }
        />
      ) : (
        <div className="card divide-y divide-surface-border overflow-hidden">
          {emails.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-content">{e.email}</p>
                  {e.label && <p className="truncate text-xs text-content-dim">{e.label}</p>}
                </div>
              </div>
              <button
                onClick={() => setDeleting(e)}
                aria-label="Remove"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-surface-border text-content-muted hover:border-status-cancelled hover:text-status-cancelled"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <AddEmailModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Remove this email?"
        message={`"${deleting?.email}" will no longer receive booking notifications.`}
        confirmLabel="Remove"
        danger
        loading={busy}
      />
    </div>
  );
}

function AddEmailModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/notification-emails", {
        method: "POST",
        body: JSON.stringify({ email, label }),
      });
      toast.success("Email added");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add email");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Notification Email"
      description="They'll get a copy of every booking-confirmation email, right away."
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !email.trim()}
            className="btn-gold px-5 py-2 text-sm"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-content-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="owner@steaktown.qa"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-content-muted">
            Label (optional)
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-base"
            placeholder="Owner, Manager…"
          />
        </label>
      </div>
    </Modal>
  );
}
