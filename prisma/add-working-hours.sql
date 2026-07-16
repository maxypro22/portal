-- =============================================================================
-- Steak Town — add the WorkingHours table (admin-editable weekly hours).
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
--
-- Seeds the 7 rows with the CURRENT hardcoded hours (Sat-Wed 12pm-12am,
-- Thu 12pm-1am, Fri 1pm-1am) so nothing changes until you edit a day from
-- the new /admin/hours page. Safe to re-run — skips rows that already exist.
-- =============================================================================

create table if not exists "WorkingHours" (
    "id"           text primary key default gen_random_uuid()::text,
    "dayOfWeek"    integer not null,
    "isOpen"       boolean not null default true,
    "openMinutes"  integer not null default 720,
    "closeMinutes" integer not null default 1440,
    "updatedAt"    timestamp(3) not null default now()
);
create unique index if not exists "WorkingHours_dayOfWeek_key" on "WorkingHours"("dayOfWeek");

insert into "WorkingHours" ("id", "dayOfWeek", "isOpen", "openMinutes", "closeMinutes")
values
  (gen_random_uuid()::text, 0, true, 720, 1440), -- Sunday    12:00 PM – 12:00 AM
  (gen_random_uuid()::text, 1, true, 720, 1440), -- Monday    12:00 PM – 12:00 AM
  (gen_random_uuid()::text, 2, true, 720, 1440), -- Tuesday   12:00 PM – 12:00 AM
  (gen_random_uuid()::text, 3, true, 720, 1440), -- Wednesday 12:00 PM – 12:00 AM
  (gen_random_uuid()::text, 4, true, 720, 1500), -- Thursday  12:00 PM – 1:00 AM
  (gen_random_uuid()::text, 5, true, 780, 1500), -- Friday     1:00 PM – 1:00 AM
  (gen_random_uuid()::text, 6, true, 720, 1440)  -- Saturday  12:00 PM – 12:00 AM
on conflict ("dayOfWeek") do nothing;

-- Verify — should show all 7 days:
select "dayOfWeek", "isOpen", "openMinutes", "closeMinutes" from "WorkingHours" order by "dayOfWeek";
