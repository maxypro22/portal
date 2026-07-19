-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- BookingSettings now holds the "last seating buffer" (minutes before
-- closing that the last bookable slot sits at) instead of a slot interval —
-- regular slot spacing stays fixed and isn't admin-editable. If you already
-- ran an earlier version of this script (with a "slotIntervalMinutes"
-- column), this renames it in place, preserving whatever value you'd set.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS "BookingSettings" (
    "id"        text PRIMARY KEY,
    "updatedAt" timestamp(3) NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BookingSettings' AND column_name = 'slotIntervalMinutes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BookingSettings' AND column_name = 'lastSeatingBufferMinutes'
  ) THEN
    ALTER TABLE "BookingSettings" RENAME COLUMN "slotIntervalMinutes" TO "lastSeatingBufferMinutes";
  END IF;
END $$;

ALTER TABLE "BookingSettings" ADD COLUMN IF NOT EXISTS "lastSeatingBufferMinutes" integer NOT NULL DEFAULT 30;

INSERT INTO "BookingSettings" ("id", "lastSeatingBufferMinutes")
VALUES ('default', 30)
ON CONFLICT ("id") DO NOTHING;
