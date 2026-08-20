# Security Overview — Chinmay Wellness Club

This document summarises the security measures implemented in this application.

## Secrets management
- All secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, DB password, GitHub PAT, Supabase access token) live ONLY in server-side environment variables.
- No secret is ever prefixed with `NEXT_PUBLIC_`, bundled into client code, or returned in any API response.
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL` are exposed to the browser (all non-sensitive).
- `.gitignore` excludes all real `.env*` files; only `.env.example` (names only) is committed.

## Database & Row Level Security (Supabase Postgres)
- RLS is ENABLED on all 8 tables: `site_content`, `testimonials`, `transformations`, `gallery`, `faqs`, `leads`, `bookings`, `admins`.
- Public content tables (`site_content`, `testimonials`, `transformations`, `gallery`, `faqs`) have a SELECT-only policy for `anon` / `authenticated`.
- `leads`, `bookings`, `admins` have NO public policies — the anon key gets ZERO access (verified: anon SELECT on `leads` returns empty/blocked).
- All writes, and all reads of `leads`/`bookings`/`admins`, happen exclusively through server-side API routes using the service-role client (which bypasses RLS) AFTER an authenticated-admin check.
- `bookings` has a UNIQUE constraint on `(booking_date, slot)` to prevent double-booking at the database level.

## Authentication (admin panel)
- Email + password, checked entirely by this app — no Supabase Auth, no OTP, no SMTP dependency.
- Passwords are hashed with Node's built-in `scrypt` (random 16-byte salt per password, 64-byte derived key, constant-time comparison on verify). Plaintext passwords are never stored or logged.
- On successful login, a session is a signed cookie (HMAC-SHA256 over `{email, exp}`, keyed by the server-only `SESSION_SECRET` env var) — HttpOnly, Secure, SameSite=Lax, 30-day expiry. `SESSION_SECRET` must be set or admin login is refused (fails closed, not open).
- `POST /api/auth/login` is rate-limited (8 attempts / 10 min / IP) and returns a generic "Invalid email or password" either way — it never reveals whether the email exists.
- Every `/api/admin/*` route re-verifies the session cookie's signature, expiry, and that the email is still a recognised admin (env allowlist or `admins` table) before any read/write. Unauthenticated or tampered-cookie requests receive `401`.
- Admins can add new admins and change any admin's password from the Admins tab (`PUT /api/admin/admins/:email/password`, `POST /api/admin/admins`) — both require an authenticated admin session and enforce an 8-character minimum password length. The last remaining admin (and any `ADMIN_EMAILS`-listed "primary" admin) cannot be deleted, to prevent total lockout.

## Input validation & abuse protection
- All public form inputs (leads, bookings, login) are validated and sanitised server-side (length limits, control-char stripping, required-field checks) — not just client-side.
- Rate limiting on `POST /api/leads`, `POST /api/bookings` (5 / minute / IP) and `POST /api/auth/login` (8 / 10 min / IP).
- File uploads to the `site-images` storage bucket are validated server-side for MIME type (jpeg/png/webp/gif) and size (<= 6 MB) before upload.

## Transport & CORS
- CORS `Access-Control-Allow-Origin` is set to the site's own origin (`NEXT_PUBLIC_SITE_URL`), not a wildcard.
- HTTPS is enforced by the host; cookies are `Secure`.

## Notes / recommendations
- Verify the sending domain in Resend and switch `RESEND_FROM` to your production domain once registered, so customer confirmation emails deliver reliably.
- Rotate any credential that was ever shared in plain text.
- `SESSION_SECRET` must be a long random value and must stay stable across deploys/restarts (rotating it invalidates every admin's session — that's expected, not a bug).
