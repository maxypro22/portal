-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- 1) Makes guestEmail optional (guests can now book with phone only).
-- 2) Adds indexes needed so the admin dashboard stays fast as bookings grow
--    into the hundreds of thousands / millions of rows:
--    - Booking(date)       -> Overview stat cards, chart window, today's timeline
--    - Booking(guestPhone) -> Clients tab grouping/search (phone is now the
--                             stable client identifier since email is optional)
--    - Booking(createdAt)  -> "booked today" counter badge on Overview
--
-- Safe to run multiple times (IF NOT EXISTS guards).

ALTER TABLE "Booking" ALTER COLUMN "guestEmail" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking" ("date");
CREATE INDEX IF NOT EXISTS "Booking_guestPhone_idx" ON "Booking" ("guestPhone");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking" ("createdAt");
