# Production Readiness Checklist — Chinmay Wellness Club

Status as of this review: **code is solid and previously passed a full backend
test suite (see `test_result.md`)**. The two live errors reported ("Could not
save" on booking, "Unable to send OTP" on admin login) are **not code bugs** —
they are unfinished deployment configuration steps. Both trace back to the
same category of cause: the live Hostinger deployment's Supabase connection
and/or Supabase Auth email setup isn't finished yet. Do the steps below in
order.

## 1. Fixed in this pass
- **Clickjacking hole removed** (`next.config.js`): the site previously sent
  `X-Frame-Options: ALLOWALL` and `frame-ancestors *` on every page, including
  `/admin` — any external website could embed your admin login in an invisible
  iframe. Tightened to same-origin only.

## 2. You must do these (cannot be done from code)

### A. Run the database migration on THIS Supabase project
Go to Supabase Dashboard → your project (`lplnwgulplsyntkgpzqz`) → **SQL
Editor** → paste the full contents of `supabase/migration.sql` → Run.
It's safe to run even if some tables already exist (`create table if not
exists`). This creates `leads`, `bookings`, `admins`, etc. If this was never
run on this specific project, every booking/lead insert will fail exactly
like the "Could not save" screenshot.

### B. Fix OTP email delivery (this is almost certainly why "Unable to send OTP" happens)
Supabase's **built-in** email sender is heavily rate-limited (a handful of
emails/hour) and is not meant for production. Fix:
1. Supabase Dashboard → **Authentication → Emails → SMTP Settings** → enable
   **Custom SMTP**.
2. Use Resend as the SMTP relay: Host `smtp.resend.com`, Port `465` (or 587),
   Username `resend`, Password = your Resend API key, Sender email = a
   verified domain address (e.g. `no-reply@chinmaywellnessclub.in`).
3. Supabase Dashboard → **Authentication → Providers → Email**: Email OTP
   enabled, OTP expiry ~15 min.
4. Supabase Dashboard → **Authentication → Email Templates → Magic Link/OTP**:
   confirm the template includes `{{ .Token }}` (so a 6-digit code is sent,
   not just a link).
5. Supabase Dashboard → **Authentication → URL Configuration**: set Site URL
   to your real production domain once you have it, and add it to Redirect
   URLs.

### C. Verify a sending domain in Resend for customer emails
`RESEND_FROM` currently falls back to `onboarding@resend.dev` if unset —
Resend's sandbox address, which **only delivers to your own Resend account
email**, not to real customers. In Resend Dashboard, verify
`chinmaywellnessclub.in` (or whatever domain you'll use), then set
`RESEND_FROM=Chinmay Wellness Club <no-reply@chinmaywellnessclub.in>` in your
env vars.

### D. Set every environment variable in Hostinger's Node.js app panel
hPanel → Websites → your app → Node.js → Environment Variables. Add every
variable from `.env.example` with real values (see the final `.env` given
separately in chat — never commit real secrets to GitHub). A missing or
mistyped `SUPABASE_SERVICE_ROLE_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` here
alone would reproduce **both** screenshot errors at once, which is the most
likely single root cause.

### E. Point your real domain + SSL at the app
The current URL (`...hostingersite.com`) is Hostinger's temporary domain.
Attach `chinmaywellnessclub.in` (or your real domain) in hPanel, enable SSL,
and update `NEXT_PUBLIC_SITE_URL` accordingly — this also fixes SEO
(`sitemap.js`/`robots.js`) and the CORS allow-list, which are keyed off it.

## 3. Rotate credentials
The GitHub PAT and Supabase `service_role` key shared in this chat should be
rotated after this work is done (GitHub → Settings → Developer settings →
regenerate; Supabase → Settings → API → reset service_role key), since
service_role bypasses all Row Level Security and a PAT can push to your repo.

## 4. Optional / lower priority
- In-memory rate limiting (`app/api/[[...path]]/route.js`) resets on every
  restart/redeploy and won't share state across multiple server instances —
  fine at current scale, revisit if you scale to multiple Node processes.
- `app/providers.js` (react-query) is set up but not used anywhere — harmless
  dead code, safe to delete or leave for future use.
