-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Adds the NotificationEmail table — owner/staff addresses managed from
-- /admin/emails that receive a copy of every booking confirmation email.
--
-- Safe to re-run (IF NOT EXISTS guard).

CREATE TABLE IF NOT EXISTS "NotificationEmail" (
    "id"        text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email"     text NOT NULL,
    "label"     text,
    "createdAt" timestamp(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationEmail_email_key" ON "NotificationEmail" ("email");
