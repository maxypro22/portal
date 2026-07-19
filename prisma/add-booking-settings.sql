-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Adds the BookingSettings table (single row, fixed id "default") — right
-- now this just holds the guest-facing time-slot interval, editable from
-- /admin/hours. Falls back to 30 minutes in code if this table/row doesn't
-- exist yet, so nothing breaks before you run this.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "BookingSettings" (
    "id"                  text PRIMARY KEY,
    "slotIntervalMinutes" integer NOT NULL DEFAULT 30,
    "updatedAt"           timestamp(3) NOT NULL DEFAULT now()
);

INSERT INTO "BookingSettings" ("id", "slotIntervalMinutes")
VALUES ('default', 30)
ON CONFLICT ("id") DO NOTHING;
