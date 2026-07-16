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
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return (json.data ?? (json as unknown)) as T;
}
