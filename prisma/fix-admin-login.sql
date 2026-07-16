-- =============================================================================
-- Force-fix the Steak Town admin login.
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- This OVERWRITES any existing admin row (or creates it if missing) with a
-- freshly-generated, verified-correct password hash for: Admin@1234
-- =============================================================================

insert into "User" ("id", "name", "email", "hashedPassword", "role")
values (
    gen_random_uuid()::text,
    'Steak Town Admin',
    'admin@steaktown.qa',
    '$2a$10$m/h1PlFIVY8P7SYm2Wuy/u9LgPnE0raiPf7hf5hdFJX9OfE1a.8wu',
    'ADMIN'
)
on conflict ("email")
do update set "hashedPassword" = excluded."hashedPassword", "role" = 'ADMIN';

-- Verify it worked — should return exactly 1 row:
select "id", "name", "email", "role", "createdAt" from "User" where "email" = 'admin@steaktown.qa';
