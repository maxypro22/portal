"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Phone,
  Mail,
  RotateCcw,
} from "lucide-react";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";
import { apiFetch } from "@/lib/fetcher";

type Client = {
  name: string;
  phone: string;
  email: string;
  bookings: number;
  totalGuests: number;
  lastVisit: string;
};
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

export function ClientsManager() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ clients: Client[]; pagination: Pagination } | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(page));
    p.set("pageSize", "10");
    return p.toString();
  }, [q, page]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ clients: Client[]; pagination: Pagination }>(
        `/api/clients?${query}`
      );
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  return (
    <div>
      {/* Search */}
      <div className="card mb-6 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-dim" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, phone, or email…"
              className="input-base pl-10"
            />
          </div>
          {q && (
            <button
              onClick={() => setQ("")}
              title="Clear search"
              className="grid w-11 shrink-0 place-items-center rounded-xl border border-surface-border text-content-dim hover:border-gold hover:text-gold"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
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
        ) : data && data.clients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No clients found"
            description={q ? "Try a different search." : "Clients appear here once bookings are made."}
            className="m-4"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-content-dim">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Phone Number</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Bookings</th>
                  <th className="px-4 py-3 font-semibold">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-600/30">
                {data?.clients.map((c) => (
                  <tr key={c.phone} className="transition-colors hover:bg-surface-sunken/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/15 font-serif text-sm font-semibold text-gold">
                          {c.name.trim().charAt(0).toUpperCase() || "?"}
                        </span>
                        <span className="font-medium text-content">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${c.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 text-content-muted transition-colors hover:text-gold"
                      >
                        <Phone className="h-3.5 w-3.5 text-gold/70" />
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-2 text-content-muted transition-colors hover:text-gold"
                        >
                          <Mail className="h-3.5 w-3.5 text-gold/70" />
                          {c.email}
                        </a>
                      ) : (
                        <span className="text-content-dim/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {c.bookings}
                      <span className="ml-1 text-xs text-content-dim">
                        ({c.totalGuests} guests)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-content-muted">
                      {new Date(c.lastVisit).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.clients.length > 0 && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 text-sm text-content-dim">
            <span>
              {(data.pagination.page - 1) * data.pagination.pageSize + 1}–
              {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} of{" "}
              {data.pagination.total} clients
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.pagination.page <= 1}
                className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border hover:border-gold hover:text-gold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={data.pagination.page >= data.pagination.totalPages}
                className="grid h-9 w-9 place-items-center rounded-lg border border-surface-border hover:border-gold hover:text-gold disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
