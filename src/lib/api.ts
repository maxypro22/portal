import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { authOptions } from "./auth";

/** Consistent JSON error envelope. */
export function apiError(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ ok: false, error: message, details: extra }, { status });
}

/** Consistent JSON success envelope. */
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Guard for admin-only API routes. Returns the session, or throws a Response
 * (401) that route handlers convert via `handleRouteError`.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw apiError("Unauthorized — please sign in.", 401);
  }
  return session;
}

/** Turn thrown errors (Zod, Response, Prisma) into a JSON response. */
export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof NextResponse) return err;
  // A thrown Response from requireAdmin()
  if (err instanceof Response) return err as NextResponse;
  if (err instanceof ZodError) {
    return apiError("Validation failed", 422, err.flatten().fieldErrors);
  }
  // Prisma unique-constraint
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") return apiError("A record with these values already exists.", 409);
    if (code === "P2025") return apiError("Record not found.", 404);
  }
  console.error("[api] Unhandled error:", err);
  return apiError("Something went wrong. Please try again.", 500);
}
