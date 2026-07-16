-- =============================================================================
-- Steak Town — Supabase database initialization
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run
-- Matches prisma/schema.prisma exactly (identifiers are case-sensitive, quoted).
-- =============================================================================

-- Supabase enables pgcrypto by default, but ensure gen_random_uuid() is available.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- User (admin login)
-- -----------------------------------------------------------------------------
create table if not exists "User" (
    "id"             text primary key default gen_random_uuid()::text,
    "name"           text not null,
    "email"          text not null,
    "hashedPassword" text not null,
    "role"           text not null default 'ADMIN',
    "createdAt"      timestamp(3) not null default now(),
    "updatedAt"      timestamp(3) not null default now()
);
create unique index if not exists "User_email_key" on "User"("email");

-- -----------------------------------------------------------------------------
-- Location (branches)
-- -----------------------------------------------------------------------------
create table if not exists "Location" (
    "id"        text primary key default gen_random_uuid()::text,
    "name"      text not null,
    "address"   text not null,
    "phone"     text not null,
    "imageUrl"  text,
    "isActive"  boolean not null default true,
    "createdAt" timestamp(3) not null default now(),
    "updatedAt" timestamp(3) not null default now()
);

-- -----------------------------------------------------------------------------
-- Table (floor plan tables)
-- -----------------------------------------------------------------------------
create table if not exists "Table" (
    "id"         text primary key default gen_random_uuid()::text,
    "locationId" text not null references "Location"("id") on delete cascade,
    "number"     integer not null,
    "capacity"   integer not null,
    "section"    text not null default 'MAIN',
    "shape"      text not null default 'square',
    "posX"       double precision not null default 50,
    "posY"       double precision not null default 50,
    "isActive"   boolean not null default true,
    "createdAt"  timestamp(3) not null default now(),
    "updatedAt"  timestamp(3) not null default now()
);
create unique index if not exists "Table_locationId_number_key" on "Table"("locationId", "number");
create index if not exists "Table_locationId_idx" on "Table"("locationId");

-- -----------------------------------------------------------------------------
-- Booking (customer reservations)
-- -----------------------------------------------------------------------------
create table if not exists "Booking" (
    "id"              text primary key default gen_random_uuid()::text,
    "reference"       text not null,
    "locationId"      text not null references "Location"("id") on delete cascade,
    "tableId"         text not null references "Table"("id") on delete cascade,
    "guestName"       text not null,
    "guestPhone"      text not null,
    "guestEmail"      text not null,
    "partySize"       integer not null,
    "date"            timestamp(3) not null,
    "timeSlot"        text not null,
    "durationMinutes" integer not null default 120,
    "status"          text not null default 'PENDING',
    "specialRequests" text,
    "createdAt"       timestamp(3) not null default now(),
    "updatedAt"       timestamp(3) not null default now()
);
create unique index if not exists "Booking_reference_key" on "Booking"("reference");
create index if not exists "Booking_locationId_date_idx" on "Booking"("locationId", "date");
create index if not exists "Booking_tableId_date_idx" on "Booking"("tableId", "date");
create index if not exists "Booking_status_idx" on "Booking"("status");

-- -----------------------------------------------------------------------------
-- Admin login (first-time account)
--   email:    admin@steaktown.qa
--   password: Admin@1234   (bcrypt-hashed below — change it after first login)
-- -----------------------------------------------------------------------------
insert into "User" ("id", "name", "email", "hashedPassword", "role")
values (
    gen_random_uuid()::text,
    'Steak Town Admin',
    'admin@steaktown.qa',
    '$2a$10$8QBjlbZgXaE4hzI7OPAfWuqJBlBcpqAawo4OAjcRNbbZI2ctVgrx6',
    'ADMIN'
)
on conflict ("email") do nothing;
