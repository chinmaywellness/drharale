# Chinmay Wellness Club

A production-ready, bilingual (Hindi + English) wellness-coaching website for **Dr. Chandrashekhar Harale**, Kolhapur — built on **Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Resend**.

## Features
- Public landing page: hero, program, process, Vimeo video-testimonial carousel, founder story, achievement stats, filterable gallery, community strip, transformations (with mandatory bilingual disclaimer), 3-step booking widget, FAQ, footer, welcome popup, multi-step lead form, final CTA banner.
- Admin panel (`/admin`): email + password login (own session, not Supabase Auth), bookings & leads dashboards (status + WhatsApp + search), full CRUD for testimonials / transformations / gallery / FAQ, content editor, booking-slot config, multi-admin management (add admins, change any admin's password), a System Health tab for self-diagnosing DB/env issues, image upload to Supabase Storage.
- SEO/AEO: semantic HTML, JSON-LD (LocalBusiness + Person + FAQPage + AggregateRating/Review from real data), `sitemap.xml`, `robots.txt`, editable meta + image alt text, dynamic OG/Twitter share image.

## Tech stack
- Next.js 15 (App Router, API routes as backend)
- Supabase: Postgres (data + RLS), Storage (`site-images` bucket) — Supabase Auth is NOT used for admin login (see below)
- Resend (transactional email + admin login is separate, see Admin login below)
- Tailwind CSS + shadcn/ui, framer-motion

## Environment variables
See `.env.example`. Required:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | Click-to-chat number |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL — also used by `robots.js`/`sitemap.js`/CORS, keep it in sync with whatever domain the site is actually served from |
| `SUPABASE_URL` | server | Supabase URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | server secret | Service role for admin/server writes |
| `SESSION_SECRET` | server secret | Signs the admin login session cookie — **required**, admin login is refused without it |
| `RESEND_API_KEY` | server secret | Resend API key |
| `RESEND_FROM` | server | Verified sender, e.g. `Chinmay Wellness Club <no-reply@chinmaywellnessclub.in>` |
| `ADMIN_EMAIL` / `ADMIN_EMAILS` | server | Admin notification recipient + primary-admin allowlist |

> Migration-only (used once, not on the running server): `SUPABASE_DB_CONNECTION_STRING`, `SUPABASE_ACCESS_TOKEN`.

## Database setup (one time)
Run `supabase/migration.sql` against the project — either in the **Supabase Dashboard → SQL Editor**, or via the Management API / `psql "$SUPABASE_DB_CONNECTION_STRING"`. It creates all tables, enables RLS + policies, seeds the admin, and creates the public `site-images` storage bucket.

Then in the Supabase Dashboard, no Auth setup is needed anymore — admin login
is email + password, handled entirely by this app (see below), not Supabase
Auth.

### Admin login: email + password (not Supabase Auth, not OTP)
`/api/auth/login` checks the submitted password against `admins.password_hash`
in Postgres (hashed with Node's built-in `scrypt`, no plaintext ever stored),
then issues a signed session cookie (HMAC-SHA256, `SESSION_SECRET` env var —
**required**, see `.env.example`). This has no dependency on Supabase Auth,
SMTP, or email delivery at all. Logged-in admins can add new admins and
change any admin's password from the **Admins** tab in `/admin`.

The first admin (`samfonde0@gmail.com`) is seeded by `supabase/migration.sql`
with a password hash for the password you were given out-of-band — change it
from the Admins tab after first login for good hygiene.

## Local development
```bash
npm install
cp .env.example .env   # fill in real values
npm run dev            # http://localhost:3000
```

## Build & start (production)
```bash
npm install
npm run build
npm start              # serves on PORT (default 3000)
```

## Deploying to Hostinger (Node.js app)
> Requires a Hostinger plan with the **Node.js** app manager (VPS or a Business/Cloud plan that exposes Node.js). Plain shared/static hosting **cannot** run this app because it needs server-side API routes (SSR) — do not use `next export`.

1. In hPanel, open **Websites → Manage → Advanced → Node.js** (or set up Node on your VPS).
2. Set **Application root** to the project folder, **Application startup file** / start command to `npm start`, and **Node version** to 18+.
3. Add all environment variables from `.env.example` (with real values) in the Node.js app **Environment Variables** section — never commit them.
4. Upload the repo (Git deploy or file manager) and run `npm install && npm run build` from the app's terminal.
5. Start the app; point the domain `chinmaywellnessclub.in` to it and enable SSL (Let's Encrypt) in hPanel.
6. Ensure the process runs persistently (Hostinger's Node manager / PM2 on VPS).

If your current Hostinger plan is static-only, host on a Node-capable target (Hostinger VPS, Vercel, Railway, Render) — the codebase is standard Next.js and deploys as-is.

## Admin login
Go to `/admin` → enter your admin email + password → **Login**. Add new admins
and change any admin's password from the **Admins** tab. If anything (login,
bookings, leads) misbehaves after a deploy, check the **Health** tab first —
it checks every database table and required env var in one place.
