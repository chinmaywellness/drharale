# Production Readiness Checklist — Chinmay Wellness Club

Status: code has been deeply audited end-to-end (backend routes, RLS/schema,
every frontend component, SEO files) and is clean — no known code bugs as of
this pass. Admin login is **email + password** (not OTP, not Supabase Auth —
that was replaced earlier). If something still doesn't work after deploying,
the **Admin → Health tab** is the fastest way to find out why (checks every
database table + required env var in one place).

## Fixed in this pass
- **`robots.js` / `sitemap.js` were reading the wrong env var**
  (`NEXT_PUBLIC_BASE_URL`, which is never set anywhere) instead of
  `NEXT_PUBLIC_SITE_URL` (which is what's actually configured). This meant
  your sitemap and robots.txt always pointed at the hardcoded fallback
  domain (`chinmaywellnessclub.in`) instead of wherever the site is actually
  deployed. Fixed to use `NEXT_PUBLIC_SITE_URL` consistently, matching every
  other file in the app.
- README.md updated — it still described the old OTP admin login flow
  (already replaced with email+password in an earlier change); now accurate.
- Stale checklist content from earlier deploy attempts removed/replaced with
  this file.

## Before every deploy, double check
1. **`supabase/migration.sql` has been run** (Supabase Dashboard → SQL
   Editor → paste the whole file → Run) against the project currently
   configured in your env vars. Safe to re-run any time.
2. **Every variable in `.env.example` is set** in Hostinger's Node.js app
   Environment Variables panel — especially `SESSION_SECRET` (admin login
   is refused without it) and `NEXT_PUBLIC_SITE_URL` (must exactly match the
   domain the site is actually served from, or CORS/sitemap break).
3. **`RESEND_FROM` is on a domain verified in your Resend account** — the
   default fallback (`onboarding@resend.dev`) only delivers to your own
   Resend account email, not real customers.
4. After deploying, open `/admin` → log in → **Health tab** → confirm every
   check is green.

## Rotate credentials
Any credential that was ever pasted into a chat (GitHub PAT, Supabase
service_role key, Resend API key) should be rotated once you're done setting
up, since service_role bypasses all Row Level Security.

## Known, accepted non-issues (not bugs)
- In-memory rate limiting resets on every restart and doesn't share state
  across multiple Node processes — fine at current traffic scale.
- `app/providers.js` (react-query) is set up but unused — harmless.
