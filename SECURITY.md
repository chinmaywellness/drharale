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
- Uses Supabase Auth native email OTP (`signInWithOtp` / `verifyOtp`) — no custom OTP logic.
- Only allow-listed admin emails (env `ADMIN_EMAILS` + the `admins` table) can receive an OTP; response is non-enumerating for non-admins.
- Session tokens (access + refresh) are stored in HttpOnly, Secure, SameSite=Lax cookies. Access token is re-validated server-side via `supabase.auth.getUser()` on every protected request; expired sessions are refreshed via the refresh token.
- Every `/api/admin/*` route verifies a valid admin session server-side before any read/write. Unauthenticated requests receive `401`.

## Input validation & abuse protection
- All public form inputs (leads, bookings, OTP) are validated and sanitised server-side (length limits, control-char stripping, required-field checks) — not just client-side.
- Rate limiting on `POST /api/leads`, `POST /api/bookings` (5 / minute / IP) and `POST /api/auth/send-otp` (5 / 10 min / IP).
- File uploads to the `site-images` storage bucket are validated server-side for MIME type (jpeg/png/webp/gif) and size (<= 6 MB) before upload.

## Transport & CORS
- CORS `Access-Control-Allow-Origin` is set to the site's own origin (`NEXT_PUBLIC_SITE_URL`), not a wildcard.
- HTTPS is enforced by the host; cookies are `Secure`.

## Notes / recommendations
- Configure a custom SMTP provider (e.g. Resend) inside Supabase Auth for reliable OTP email delivery in production (the built-in email service is rate-limited).
- Verify the sending domain in Resend and switch `RESEND_FROM` to `no-reply@chinmaywellnessclub.in` so customer confirmation emails deliver to any recipient.
- Rotate any credential that was ever shared in plain text.
