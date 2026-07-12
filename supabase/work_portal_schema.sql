-- ==========================================================================
-- EVOLIX — Work Portal schema
-- Run this in Supabase SQL Editor AFTER running supabase/schema.sql.
-- This adds the table that powers the inline "Manage Content" upload
-- portal on the Work, Product Photography, Amazon A+, and Custom
-- Software pages.
-- ==========================================================================

-- ---------- Table: work_items ----------
create table if not exists work_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('work', 'photography', 'amazon-aplus', 'custom-software')),
  title text not null,
  description text,
  image_url text,
  file_url text,
  file_label text,
  link_url text,
  is_hidden boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists idx_work_items_category on work_items (category, is_hidden, sort_order);

alter table work_items enable row level security;

-- Public visitors (anon key) can only see items that aren't hidden
create policy "Public can view visible work items"
  on work_items for select
  to anon
  using (is_hidden = false);

-- Logged-in partners (any of the 3, via the shared account) see everything,
-- including hidden items, so they can un-hide them later
create policy "Authenticated can view all work items"
  on work_items for select
  to authenticated
  using (true);

create policy "Authenticated can insert work items"
  on work_items for insert
  to authenticated
  with check (true);

create policy "Authenticated can update work items"
  on work_items for update
  to authenticated
  using (true);

create policy "Authenticated can delete work items"
  on work_items for delete
  to authenticated
  using (true);

-- ==========================================================================
-- Storage bucket (do this part in the dashboard, not SQL editor):
--
-- 1. Go to Storage in the left sidebar → "New bucket"
-- 2. Name it exactly: work-uploads
-- 3. Toggle "Public bucket" ON (so images/files can be displayed on the
--    site without needing a signed URL)
-- 4. Create it
--
-- Then run the policies below in the SQL Editor so only logged-in partners
-- can upload/delete files, while anyone can view them:
-- ==========================================================================

create policy "Public can view work-uploads files"
  on storage.objects for select
  to public
  using (bucket_id = 'work-uploads');

create policy "Authenticated can upload work-uploads files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'work-uploads');

create policy "Authenticated can update work-uploads files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'work-uploads');

create policy "Authenticated can delete work-uploads files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'work-uploads');

-- ==========================================================================
-- Shared login (do this part in the dashboard too):
--
-- 1. Go to Authentication → Users → "Add user" → "Create new user"
-- 2. Enter one shared email + password (e.g. team@evolix.agency)
-- 3. Turn OFF "Auto Confirm User" only if you want an email confirmation
--    step — for a 3-person shared account, leave it ON so it's ready
--    to use immediately.
-- 4. Share that email + password with your two partners directly
--    (WhatsApp, in person, etc.) — this is the login the "Manage Content"
--    button on the site will ask for.
-- ==========================================================================
