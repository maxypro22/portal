/**
 * Thin client-side fetch wrapper that unwraps our { ok, data, error } envelope
 * and throws a readable Error on failure (so callers can toast `err.message`).
 */
export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let json: { ok?: boolean; data?: T; error?: string; details?: unknown } = {};
  try {
    json = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok || json.ok === false) {
    const fieldErrors = formatFieldErrors(json.details);
    const message = json.error || `Request failed (${res.status})`;
    throw new Error(fieldErrors ? `${message}: ${fieldErrors}` : message);
  }
  return (json.data ?? (json as unknown)) as T;
}

/** Turn Zod's flattened fieldErrors ({ field: [msg, ...] }) into "field — msg" text. */
function formatFieldErrors(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const parts = Object.entries(details as Record<string, unknown>)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .map(([field, messages]) => `${field} — ${(messages as string[]).join(", ")}`);
  return parts.length ? parts.join("; ") : null;
}
