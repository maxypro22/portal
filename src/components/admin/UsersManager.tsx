"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Plus, KeyRound, Trash2, UserCog, Mail } from "lucide-react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";

type UserRow = { id: string; name: string; email: string; role: string; createdAt: string };

export function UsersManager() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [changingPassword, setChangingPassword] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<UserRow[]>("/api/users");
      setUsers(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/users/${deleting.id}`, { method: "DELETE" });
      toast.success("User removed");
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
        <button onClick={() => setAdding(true)} className="btn-gold px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" /> Add Admin
        </button>
      </div>

      {!users ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UserCog className="h-8 w-8" />}
          title="No admin accounts yet"
          description="Add the first login for your team."
          action={
            <button onClick={() => setAdding(true)} className="btn-gold px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" /> Add Admin
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-content-dim">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Added</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-surface-sunken/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 font-serif text-sm font-semibold text-gold">
                          {u.name.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="font-medium text-content">
                          {u.name}
                          {u.id === currentUserId && (
                            <span className="ml-2 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${u.email}`}
                        className="flex items-center gap-2 text-content-muted transition-colors hover:text-gold"
                      >
                        <Mail className="h-3.5 w-3.5 text-gold/70" />
                        {u.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setChangingPassword(u)}
                          title="Change password"
                          className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border text-content-muted hover:border-gold hover:text-gold"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          disabled={u.id === currentUserId}
                          title={u.id === currentUserId ? "You can't delete your own account" : "Delete"}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border text-content-muted hover:border-status-cancelled hover:text-status-cancelled disabled:cursor-not-allowed disabled:opacity-30"
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

      {adding && (
        <AddUserModal
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      {changingPassword && (
        <ChangePasswordModal user={changingPassword} onClose={() => setChangingPassword(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Remove admin account?"
        message={`"${deleting?.name}" will no longer be able to sign in to the dashboard.`}
        confirmLabel="Remove"
        danger
        loading={busy}
      />
    </div>
  );
}

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      toast.success("Admin account created");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Admin"
      description="They'll use this email and password to sign in at /admin/login."
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim() || !email.trim() || password.length < 8}
            className="btn-gold px-5 py-2 text-sm"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Labeled label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" placeholder="Full name" />
        </Labeled>
        <Labeled label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="name@steaktown.qa"
          />
        </Labeled>
        <Labeled label="Password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="At least 8 characters"
          />
        </Labeled>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await apiFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
      });
      toast.success(`Password updated for ${user.name}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Change Password — ${user.name}`}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || password.length < 8}
            className="btn-gold px-5 py-2 text-sm"
          >
            {saving ? "Saving…" : "Update Password"}
          </button>
        </>
      }
    >
      <Labeled label="New password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-base"
          placeholder="At least 8 characters"
          autoFocus
        />
      </Labeled>
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
