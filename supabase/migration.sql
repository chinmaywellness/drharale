-- ================= CHINMAY WELLNESS CLUB — SUPABASE SCHEMA + RLS =================

create table if not exists public.site_content (
  id text primary key default 'site',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text, city text, quote text, rating int default 5,
  vimeo_url text, result_tag text, sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.transformations (
  id uuid primary key default gen_random_uuid(),
  name text, before_image text, after_image text, result_tag text,
  disclaimer_text text default 'यह परिणाम सामान्य नहीं है। परिणाम व्यक्ति दर व्यक्ति भिन्न हो सकते हैं। / This result is not typical. Results may vary from person to person.',
  note text, sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text, category text, alt_text text, sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text, answer text, sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text, whatsapp text, email text, goal text, preferred_time text,
  status text default 'New', created_at timestamptz default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text, whatsapp text, email text, goal text,
  booking_date text, slot text, status text default 'New',
  created_at timestamptz default now(),
  constraint bookings_date_slot_unique unique (booking_date, slot)
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

insert into public.admins (email) values ('samfonde0@gmail.com') on conflict (email) do nothing;

-- ================= RLS =================
alter table public.site_content enable row level security;
alter table public.testimonials enable row level security;
alter table public.transformations enable row level security;
alter table public.gallery enable row level security;
alter table public.faqs enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.admins enable row level security;

-- public read policies (anon + authenticated) for content tables
drop policy if exists "public_read_site_content" on public.site_content;
create policy "public_read_site_content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "public_read_testimonials" on public.testimonials;
create policy "public_read_testimonials" on public.testimonials for select to anon, authenticated using (true);
drop policy if exists "public_read_transformations" on public.transformations;
create policy "public_read_transformations" on public.transformations for select to anon, authenticated using (true);
drop policy if exists "public_read_gallery" on public.gallery;
create policy "public_read_gallery" on public.gallery for select to anon, authenticated using (true);
drop policy if exists "public_read_faqs" on public.faqs;
create policy "public_read_faqs" on public.faqs for select to anon, authenticated using (true);

-- leads, bookings, admins: NO anon/authenticated policies -> anon gets zero access.
-- All access happens via service-role server routes (service role bypasses RLS).

-- ================= STORAGE =================
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true) on conflict (id) do nothing;
drop policy if exists "public_read_site_images" on storage.objects;
create policy "public_read_site_images" on storage.objects for select to anon, authenticated using (bucket_id = 'site-images');
