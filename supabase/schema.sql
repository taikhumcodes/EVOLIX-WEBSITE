-- ==========================================================================
-- EVOLIX — Supabase schema
-- Run this once in your Supabase project's SQL editor:
-- Dashboard → SQL Editor → New query → paste this whole file → Run
-- ==========================================================================

-- ---------- Table: page_visits ----------
-- One row per page load. No personally identifying data is stored beyond
-- what the browser sends anyway (user agent, referrer).
create table if not exists page_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page_path text,
  referrer text,
  user_agent text,
  session_id text,
  landing_source text
);

-- ---------- Table: project_inquiries ----------
-- One row per "Start a Project" contact form submission.
create table if not exists project_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  budget text,
  message text not null,
  source_path text,
  session_id text,
  status text not null default 'new' -- new | contacted | won | lost
);

-- ---------- Table: newsletter_signups ----------
create table if not exists newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  session_id text
);

-- ==========================================================================
-- Row Level Security
-- The site uses your public "anon" key in the browser. These policies let
-- that key INSERT new rows only — it can never read, update, or delete
-- data. You view/manage everything from the Supabase dashboard, which
-- authenticates with your account, not this key.
-- ==========================================================================

alter table page_visits enable row level security;
alter table project_inquiries enable row level security;
alter table newsletter_signups enable row level security;

create policy "Public can insert visits"
  on page_visits for insert
  to anon
  with check (true);

create policy "Public can insert inquiries"
  on project_inquiries for insert
  to anon
  with check (true);

create policy "Public can insert newsletter signups"
  on newsletter_signups for insert
  to anon
  with check (true);

-- No select/update/delete policies are created for the anon role,
-- so the public key cannot read back any stored data.

-- ---------- Helpful indexes for the dashboard/reporting ----------
create index if not exists idx_page_visits_created_at on page_visits (created_at desc);
create index if not exists idx_inquiries_created_at on project_inquiries (created_at desc);
create index if not exists idx_inquiries_status on project_inquiries (status);
