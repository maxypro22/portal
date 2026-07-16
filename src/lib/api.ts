import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
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

  // Known Prisma query errors — constraint violations, missing records, etc.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return apiError("A record with these values already exists.", 409);
      case "P2025":
        return apiError("Record not found.", 404);
      case "P2003":
        return apiError("This action conflicts with related records.", 409);
      case "P2034":
        return apiError("That record was just changed by someone else. Please try again.", 409);
    }
  }

  // Database unreachable / bad credentials / connection couldn't be established.
  // (This is exactly the error class a wrong DATABASE_URL / DIRECT_URL throws.)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error("[api] Database connection error:", err.message);
    return apiError("Could not reach the database. Please try again shortly.", 503);
  }

  // A query we built ourselves was malformed — a bug, not a user error.
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("[api] Invalid database query:", err.message);
    return apiError("Something went wrong processing that request.", 500);
  }

  console.error("[api] Unhandled error:", err);
  return apiError("Something went wrong. Please try again.", 500);
}
