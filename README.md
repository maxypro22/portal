# 🥩 Steak Town — Table Booking Portal

A production-quality restaurant table-booking portal for **Steak Town** (steaktown.qa),
a luxury steakhouse in Doha, Qatar. Features a public multi-step booking wizard and a
protected admin dashboard for managing reservations, clients, working hours, and locations.

Built with **Next.js 14 (App Router)** · **TypeScript** · **Tailwind CSS** ·
**Prisma** · **Supabase (Postgres)** · **NextAuth** — deployable to **Vercel**.

---

## ✨ Features

**Public site** — luxury design system (near-black header, warm-brown footer, gold
accents, real Steak Town logo), light/dark theme toggle, Home / Contact pages,
and a **4-step booking wizard**: Location → Guests/Date/Time (pill-bar dropdowns: guest
count, a real month calendar, a time list) → guest details (+974 phone, "what are you in
the mood for" menu picker) → confirmation with an `ST-2026-XXXX` reference. No table is
chosen by the guest — the best-fitting available table is auto-assigned server-side at
booking time. Double-booking is prevented via a Serializable transaction (not just an
app-level check) so two simultaneous requests can't be handed the same table/slot.

**Admin dashboard** (`/admin`) — branded login, overview (stat cards + 14-day chart +
today's timeline), bookings management (search / filter / paginate + status actions),
**clients** directory (name · phone · email), **working hours** editor (per-day open/close
times, or close a day entirely — drives the public booking flow's available time slots),
and location management. Shares the same light/dark theme toggle as the public site.

---

## 🚀 Quick Start (local, against Supabase)

### 1. Create a Supabase project
[supabase.com](https://supabase.com) → **New project**. Then open
**Project Settings → Database → Connection string** (or the **Connect** button) and copy both:
- **Transaction pooler** (port `6543`) → `DATABASE_URL`
- **Session / direct** (port `5432`) → `DIRECT_URL`

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env` (see [Environment Variables](#-environment-variables) below).

### 3. Install, push schema, seed
```bash
npm install
npm run db:setup     # = prisma db push  +  seed (admin + demo data)
```
`db:setup` already creates the `WorkingHours` table via `prisma db push`. On an
**existing** database (one you set up before this feature existed), either re-run
`npm run db:push`, or run `prisma/add-working-hours.sql` once in the Supabase SQL Editor —
it also seeds the 7 rows with the current hardcoded defaults, so nothing changes until
you edit a day from `/admin/hours`.

### 4. Run
```bash
npm run dev          # http://localhost:3000
```

> Admin: **admin@steaktown.qa / Admin@1234** (or your `ADMIN_*` values).

---

## 🔑 Environment Variables

| Variable          | Purpose                                                                 |
|-------------------|-------------------------------------------------------------------------|
| `DATABASE_URL`    | Supabase **pooled** connection (pgbouncer, `6543`) — app runtime         |
| `DIRECT_URL`      | Supabase **direct** connection (`5432`) — Prisma `db push` / migrations  |
| `NEXTAUTH_SECRET` | Session signing secret — `openssl rand -base64 32`                       |
| `NEXTAUTH_URL`    | `http://localhost:3000` locally · your Vercel URL in production          |
| `ADMIN_EMAIL`     | First-time / bootstrap admin email                                      |
| `ADMIN_PASSWORD`  | First-time / bootstrap admin password                                   |
| `ADMIN_NAME`      | Admin display name                                                       |

Example connection strings (replace `[PROJECT-REF]`, `[PASSWORD]`, `[REGION]`):
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

**Security notes**
- `.env` is git-ignored — only `.env.example` (placeholders) is committed.
- Any non-alphanumeric character in the DB password (`# @ : / ? % [ ]` etc.) must be
  percent-encoded in the connection string (e.g. `#` → `%23`) or the URL fails to parse.
- The pooled URL uses `pgbouncer=true&connection_limit=1`, which is required for
  serverless (Vercel) so each function reuses a single pooled connection.
- `sslmode=require` enforces TLS to Supabase.
- Rotate `NEXTAUTH_SECRET` and the admin password before going live.

---

## ▲ Deploy to Vercel

1. **Push to GitHub** (see below), then in Vercel: **Add New → Project → Import** the repo.
2. **Environment Variables** — add every variable from the table above
   (set `NEXTAUTH_URL` to your Vercel URL, e.g. `https://steak-town.vercel.app`).
   Values are pasted raw in Vercel's UI — no surrounding quotes.
3. Vercel auto-detects Next.js. The `vercel-build` script runs
   `prisma generate && next build`, so no extra config is needed.
4. **Initialize the database once** (from your machine, with `.env` pointing at Supabase):
   ```bash
   npm run db:setup
   ```
   This pushes the schema and creates the admin. (You can also just deploy and sign in —
   the **first login bootstraps the admin** automatically, then build your locations and
   tables from the admin UI.)
5. Open `https://<your-app>.vercel.app/admin` and sign in.

> **First-login bootstrap:** when the database has *no* users yet, signing in with
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` creates the admin on the fly. After that, only the
> stored account works — change the password from your env/seed for production.

---

## 📤 Push to GitHub

```bash
git init
git add -A
git commit -m "Steak Town booking portal"
git branch -M main
# with GitHub CLI:
gh repo create steak-town-portal --private --source=. --remote=origin --push
# or manually:
git remote add origin https://github.com/<you>/steak-town-portal.git
git push -u origin main
```

---

## 📜 NPM Scripts

| Script              | Description                                        |
|----------------------|----------------------------------------------------|
| `npm run dev`        | Dev server                                         |
| `npm run build`      | Production build (`next build`)                    |
| `npm start`          | Start production server                            |
| `npm run db:push`    | Sync Prisma schema to Supabase (`prisma db push`)  |
| `npm run db:seed`    | Seed admin (+ demo data on an empty DB)            |
| `npm run db:setup`   | `db:push` + `db:seed` in one step                  |
| `npm run db:studio`  | Prisma Studio (visual DB browser)                  |

---

## 🗂 Structure

```
prisma/  schema.prisma (Postgres) · seed.ts (idempotent, env-driven admin)
        · supabase-init.sql / seed-locations.sql / fix-admin-login.sql / add-working-hours.sql
          (manual SQL alternatives — see comments in each file)
src/
  app/(site)/     public site + booking wizard
  app/admin/      login + protected dashboard (overview, bookings, clients, working hours, locations)
  app/api/        auth · locations · availability · bookings · clients · working-hours
  components/     layout (Header/Footer) · booking (WizardProgress, BookingWizard)
                  · admin · ui (incl. ThemeToggle)
  lib/            prisma · auth (bootstrap) · api · booking (auto-assign, transactions)
                  · hours (DB-backed working hours) · validations · utils · constants
  middleware.ts   protects /admin
```

---

## 🧠 Booking Rules
- Working hours are **database-backed and admin-editable** (`/admin/hours` → `WorkingHours`
  table, `src/lib/hours.ts`) — defaults to Sat–Wed 12pm–12am · Thu 12pm–1am · Fri 1pm–1am
  until changed. Any day can be closed entirely.
- Each booking holds a table for **120 minutes**; slots are 30-min intervals.
- Guests pick a location, party size (1–15), date, and time only — no table selection.
  The smallest available table that fits the party is auto-assigned at booking time
  (see `pickAvailableTable` in `src/lib/booking.ts`).
- Table assignment + creation run inside a single **Serializable** Postgres transaction
  (`runSerializable`), so two simultaneous requests for the same slot can't both succeed —
  Postgres rejects one and it's automatically retried.
- Bookings can't be made in the past, outside working hours, or beyond a 90-day horizon.

© Steak Town — All Rights Reserved.
