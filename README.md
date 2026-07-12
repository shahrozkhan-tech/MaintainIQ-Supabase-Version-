# MaintainIQ — AI-Powered QR Maintenance System

A production-ready, mobile-first maintenance tracking app built with **HTML5, CSS3, vanilla JavaScript, and Supabase**. No frameworks, no build step — open the files in a browser or serve them statically.

## Stack
- HTML5 / CSS3 / ES6+ JavaScript (no React/Vue/Angular/Bootstrap/Tailwind)
- Supabase (Auth + Database) — connects to your existing project/tables
- QRCode.js for QR generation
- Lucide Icons (CDN)

## Getting started

1. Serve the `project/` folder with any static file server (required for Supabase auth redirects to work correctly), e.g.:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
2. Open `index.html` in your browser. You'll be redirected to `login.html` if not signed in.
3. Create an account on `signup.html`, or sign in if you already have one.

Your Supabase URL and anon/publishable key are already wired up in `js/supabase.js`. No SQL, migrations, or table creation is performed by this app — it reads and writes to your existing `assets` and `tickets` tables.

## Expected tables (already created by you)

**assets**: `id (uuid)`, `code (text)`, `name (text)`, `category (text)`, `location (text)`, `status (text)`, `history (jsonb)`, `created_at (timestamptz)`

**tickets**: `id (uuid)`, `code (text)`, `asset_id (uuid → assets.id)`, `asset_code (text)`, `reporter_name (text)`, `description (text)`, `urgency (text)`, `status (text)`, `assigned_to (text)`, `notes (jsonb)`, `created_at (timestamptz)`, `updated_at (timestamptz)`

The `notes` jsonb column stores an array of timeline entries (`{type, text, created_at}`) for maintenance notes, status changes, technician assignments, and completion dates — this powers the ticket detail view and the Asset History timeline without needing extra columns.

## Pages
- `index.html` — auth redirect gate
- `login.html` / `signup.html` — Supabase Authentication
- `dashboard.html` — stats, charts, recent activity, upcoming maintenance, quick actions
- `assets.html` — asset CRUD, search & filters, auto-generated asset codes (A-001, A-002, …)
- `qr.html` — generate/download/print/regenerate QR codes per asset
- `public.html` — **no login required**; the page a scanned QR code lands on, with an issue report form
- `tickets.html` — admin ticket workflow (Reported → Assigned → Resolved), technician assignment, maintenance notes, completion dates
- `history.html` — vertical timeline of everything that happened to an asset
- `profile.html` / `settings.html` — account info, dark/light mode, profile update, password change, logout

## Notes
- Row Level Security: make sure your Supabase RLS policies allow authenticated users to manage `assets`/`tickets`, and allow **anonymous** `select` on `assets` + `insert` on `tickets` so the public QR page works for unauthenticated visitors.
- Dark/Light mode preference is stored in `localStorage` (UI preference only — not app data).
