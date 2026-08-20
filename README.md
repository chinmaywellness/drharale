# Chinmay Wellness Club

A production-ready, bilingual (Hindi + English) wellness-coaching website for **Dr. Chandrashekhar Harale**, Kolhapur — built on **Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Resend**.

## Features
- Public landing page: hero, program, process, Vimeo video-testimonial carousel, founder story, achievement stats, filterable gallery, community strip, transformations (with mandatory bilingual disclaimer), 3-step booking widget, FAQ, footer, welcome popup, multi-step lead form.
- Admin panel (`/admin`): Supabase-Auth email OTP login, bookings & leads dashboards (status + WhatsApp + search), full CRUD for testimonials / transformations / gallery / FAQ, content editor, booking-slot config, multi-admin management, image upload to Supabase Storage.
- SEO/AEO: semantic HTML, JSON-LD (LocalBusiness + FAQPage + AggregateRating/Review from real data), `sitemap.xml`, `robots.txt`, editable meta + image alt text.

## Tech stack
- Next.js 15 (App Router, API routes as backend)
- Supabase: Postgres (data + RLS), Auth (email OTP), Storage (`site-images` bucket)
- Resend (transactional email)
- Tailwind CSS + shadcn/ui, framer-motion

## Environment variables
See `.env.example`. Required:

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | Click-to-chat number |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL |
| `SUPABASE_URL` | server | Supabase URL (server) |
| `SUPABASE_SERVICE_ROLE_KEY` | server secret | Service role for admin/server writes |
| `RESEND_API_KEY` | server secret | Resend API key |
| `RESEND_FROM` | server | Verified sender, e.g. `Chinmay Wellness Club <no-reply@chinmaywellnessclub.in>` |
| `ADMIN_EMAIL` / `ADMIN_EMAILS` | server | Admin notification + OTP allowlist |

> Migration-only (used once, not on the running server): `SUPABASE_DB_CONNECTION_STRING`, `SUPABASE_ACCESS_TOKEN`.

## Database setup (one time)
Run `supabase/migration.sql` against the project — either in the **Supabase Dashboard → SQL Editor**, or via the Management API / `psql "$SUPABASE_DB_CONNECTION_STRING"`. It creates all tables, enables RLS + policies, seeds the admin, and creates the public `site-images` storage bucket.

Then in the Supabase Dashboard:
- **Authentication → Providers → Email**: keep Email provider enabled (this is required for the OTP token to be generated at all). Custom SMTP is **not** needed — see below.
- **Authentication → URL Configuration**: Site URL = your deployed domain (add as allowed redirect URL too).

### OTP delivery: Resend directly, not Supabase SMTP
`/api/auth/send-otp` uses `supabase.auth.admin.generateLink({ type: 'magiclink' })`
to get a 6-digit `email_otp` from Supabase **without Supabase sending any
email** — Supabase's built-in mailer/SMTP is bypassed entirely. The app then
emails that code itself via the Resend API (`sendOtpEmail` in
`app/api/[[...path]]/route.js`). This avoids Supabase's default email rate
limits and the extra step of configuring SMTP. `/api/auth/verify-otp` still
verifies through Supabase Auth (`verifyOtp({ type: 'email' })`), so sessions
and the admin allowlist work exactly as before — only the sending path
changed.

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
Go to `/admin` → enter an allow-listed admin email → **Send OTP** → enter the 6-digit code from the email. No password. Add/remove admins from the **Admins** tab.
