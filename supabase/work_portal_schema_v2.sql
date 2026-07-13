-- ==========================================================================
-- EVOLIX — Work Portal schema, v2 migration
-- Run this AFTER supabase/work_portal_schema.sql (safe to run on top of
-- an existing work_items table — it alters, it doesn't recreate).
--
-- Changes:
--   1. Categories now match the 6 service pages exactly, instead of the
--      original 4 general buckets — so a project can be filtered/linked
--      to from any specific service page.
--   2. Projects can now hold multiple images (image_urls, a list) instead
--      of just one.
-- ==========================================================================

-- ---------- 1. Update category options ----------
alter table work_items drop constraint if exists work_items_category_check;

alter table work_items add constraint work_items_category_check
  check (category in (
    'website-development',
    'branding',
    'amazon-aplus',
    'product-photography',
    'custom-software',
    'digital-marketing'
  ));

-- If you already have items saved under the old category names, remap them:
update work_items set category = 'product-photography' where category = 'photography';
update work_items set category = 'amazon-aplus' where category = 'amazon-aplus'; -- unchanged, no-op
update work_items set category = 'custom-software' where category = 'custom-software'; -- unchanged, no-op
-- Anything that was saved under the old generic 'work' category needs a
-- manual category assignment now, since 'work' is no longer a valid option:
-- run this SELECT to find them, then update each one by id to a real category:
-- select id, title from work_items where category = 'work';

-- ---------- 2. Multi-image support ----------
alter table work_items add column if not exists image_urls jsonb not null default '[]'::jsonb;

-- Migrate any existing single image_url values into the new array column
update work_items
  set image_urls = jsonb_build_array(image_url)
  where image_url is not null and image_urls = '[]'::jsonb;

alter table work_items drop column if exists image_url;
