# 🥩 Steak Town — Table Booking Portal

A production-quality restaurant table-booking portal for **Steak Town** (steaktown.qa),
a luxury steakhouse in Doha, Qatar. Features a public multi-step booking wizard with an
interactive floor plan, and a protected admin dashboard for managing reservations,
clients, tables, and locations.

Built with **Next.js 14 (App Router)** · **TypeScript** · **Tailwind CSS** ·
**Prisma** · **Supabase (Postgres)** · **NextAuth** — deployable to **Vercel**.

---

## ✨ Features

**Public site** — luxury design system (near-black header, warm-brown footer, gold
accents, real Steak Town logo), Home / Menu / Contact pages, and a **6-step booking
wizard**: Location → interactive floor plan (Main Hall · Terrace · VIP) → party size →
date & time (working-hours-aware) → guest details (+974 phone) → confirmation with an
`ST-2026-XXXX` reference. Double-booking is prevented via a 2-hour overlap check.

**Admin dashboard** (`/admin`) — branded login, overview (stat cards + 14-day chart +
today's timeline), bookings management (search / filter / paginate + status actions),
**clients** directory (name · phone · email), live floor view, and full CRUD for tables
(click-to-place) and locations.

---

## 🚀 Quick Start (local, against Supabase)

### 1. Create a Supabase project
[supabase.com](https://supabase.com) → **New project**. Then open
**Project Settings → Database → Connection string** and copy both:
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
- The pooled URL uses `pgbouncer=true&connection_limit=1`, which is required for
  serverless (Vercel) so each function reuses a single pooled connection.
- `sslmode=require` enforces TLS to Supabase.
- Rotate `NEXTAUTH_SECRET` and the admin password before going live.

---

## ▲ Deploy to Vercel

1. **Push to GitHub** (see below), then in Vercel: **Add New → Project → Import** the repo.
2. **Environment Variables** — add every variable from the table above
   (set `NEXTAUTH_URL` to your Vercel URL, e.g. `https://steak-town.vercel.app`).
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

| Script            | Description                                        |
|-------------------|----------------------------------------------------|
| `npm run dev`     | Dev server                                         |
| `npm run build`   | Production build (`next build`)                    |
| `npm start`       | Start production server                            |
| `npm run db:push` | Sync Prisma schema to Supabase (`prisma db push`)  |
| `npm run db:seed` | Seed admin (+ demo data on an empty DB)            |
| `npm run db:setup`| `db:push` + `db:seed` in one step                  |
| `npm run db:studio` | Prisma Studio (visual DB browser)                |

---

## 🗂 Structure

```
prisma/  schema.prisma (Postgres) · seed.ts (idempotent, env-driven admin)
src/
  app/(site)/     public site + booking wizard
  app/admin/      login + protected dashboard (overview, bookings, clients, floor, tables, locations)
  app/api/        auth · locations · tables · availability · bookings · clients
  components/     layout · booking (FloorPlan, TableGrid, Wizard) · admin · ui
  lib/            prisma · auth (bootstrap) · api · booking rules · validations · utils · constants
  middleware.ts   protects /admin
```

---

## 🧠 Booking Rules
- Working hours: Sat–Wed 12pm–12am · Thu 12pm–1am · Fri 1pm–1am.
- Each booking holds a table for **120 minutes**; slots are 30-min intervals.
- A table is blocked when an active booking's 2-hour window overlaps — enforced in the UI
  and again server-side at write time.

© Steak Town — All Rights Reserved.
