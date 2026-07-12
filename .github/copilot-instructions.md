# VoltMarket — AI Agent Instructions

> Context and guardrails for AI dev agents (GitHub Copilot / Claude) working on this repo.

## What this project is

**VoltMarket** is a multi-page marketplace for buying and selling **electric vehicles**.
It is the capstone project for SoftUni's *Software Technologies with AI* course. Users
register, publish listings with photos and EV-specific specs (battery, range, mileage),
save favorites, and browse by category/filters. Every new listing starts as `pending` and
is published only after an **admin** approves it.

## Tech stack (do not deviate)

- **Frontend:** HTML + CSS + **vanilla JavaScript** (ES modules) + **Bootstrap 5** + Bootstrap Icons.
  - ❌ No TypeScript. ❌ No React/Vue/Svelte or any SPA framework.
- **Backend:** **Supabase** — Postgres DB, Auth (JWT), Storage.
- **Build:** Node.js + npm + **Vite** (multi-page via `rollupOptions.input`).
- **Deploy:** Netlify (`vite build` → `dist`).

## Architecture & conventions

- **Multi-page, not SPA.** Each screen is a separate `*.html` file at the project root,
  each loading one entry module from `src/pages/`. No client-side router, no popups-as-pages.
- **Layered/modular code** — keep responsibilities separated:
  - `src/lib/` — cross-cutting setup (`supabaseClient.js`, `theme.js` for Bootstrap+CSS imports).
  - `src/services/` — all Supabase data access. **UI never calls `supabase` directly**; it goes through a service.
  - `src/pages/` — one module per screen; wires DOM + services. Imports `../lib/theme.js` first.
  - `src/components/` — reusable UI (navbar, footer, toast, listing card, image uploader).
  - `src/utils/` — pure helpers (dom, format, validation, route guards).
  - `src/styles/` — `main.css` plus any page-specific styles.
- **Env:** Supabase URL + anon key come from `import.meta.env.VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`. Never hard-code keys. `.env` is git-ignored; `.env.example` is committed.
- **Security lives in the database (RLS), not the client.** The frontend is untrusted.
  Never rely on hiding a button for access control — the row-level policies + triggers in
  `supabase/migrations/` are the source of truth.

## Data model (see `supabase/migrations/`)

`profiles` (1:1 auth.users) · `categories` · `listings` · `listing_images` · `favorites` · `user_roles`.

- A listing belongs to a `profile` (seller) and a `category`; it has many `listing_images`.
- `favorites` is a many-to-many between profiles and listings.
- Roles: normal user + `admin` (via `user_roles`). `public.is_admin()` is the RLS helper.
- **Moderation is server-side:** the `enforce_listing_rules()` trigger forces new listings to
  `pending` and blocks non-admins from self-approving. Do not move this logic to the client.

## Storage

Two public-read buckets: `listing-images` and `avatars`. Uploads go to `"{userId}/..."`
paths (storage RLS checks the first path segment against `auth.uid()`).

## Working style

- Small, focused commits. Follow the AI dev loop: prompt → implement → run → test → commit.
- When changing the DB schema, add a **new timestamped migration** in `supabase/migrations/`;
  never edit an already-applied migration.
- Keep pages responsive (Bootstrap grid) and accessible (labels, alt text, focus states).
- Prefer editing existing files over adding new ones; match the existing structure and naming.
