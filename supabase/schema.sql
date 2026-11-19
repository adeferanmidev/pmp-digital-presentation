-- PMP initial publishing schema
create extension if not exists pgcrypto;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  subject_name text not null,
  category text not null default 'People & Purpose',
  cover_image text not null default '',
  excerpt text not null default '',
  body text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  file_path text not null,
  alt_text text not null default '',
  media_type text not null default 'image',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  display_order integer not null default 0
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.stories enable row level security;
alter table public.story_media enable row level security;
alter table public.categories enable row level security;
alter table public.site_settings enable row level security;

-- Public visitors can read published stories only.
create policy "Public can read published stories" on public.stories
for select using (status = 'published');

-- Editor access is explicitly granted to selected Auth users.
create table if not exists public.editor_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.editor_users enable row level security;
create or replace function public.is_pmp_editor()
returns boolean language sql stable security definer set search_path = public
as $ select exists (select 1 from public.editor_users where user_id = (select auth.uid())); $;
revoke all on function public.is_pmp_editor() from public;
grant execute on function public.is_pmp_editor() to authenticated;
create policy "Editors can read their own grant" on public.editor_users
for select to authenticated using (user_id = (select auth.uid()));
create policy "Editors manage stories" on public.stories
for all to authenticated using (public.is_pmp_editor()) with check (public.is_pmp_editor());
create policy "Public can read media for published stories" on public.story_media
for select using (exists (select 1 from public.stories s where s.id = story_id and s.status = 'published'));
create policy "Editors manage story media" on public.story_media
for all to authenticated using (public.is_pmp_editor()) with check (public.is_pmp_editor());
create policy "Public can read categories" on public.categories
for select using (true);
create policy "Editors manage categories" on public.categories
for all to authenticated using (true) with check (true);
create policy "Public can read site settings" on public.site_settings
for select using (true);
create policy "Editors manage site settings" on public.site_settings
for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pmp-media','pmp-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Public read PMP media" on storage.objects for select using (bucket_id = 'pmp-media');
create policy "Editors upload PMP media" on storage.objects for insert to authenticated with check (bucket_id = 'pmp-media' and public.is_pmp_editor());
create policy "Editors update PMP media" on storage.objects for update to authenticated using (bucket_id = 'pmp-media' and public.is_pmp_editor()) with check (bucket_id = 'pmp-media' and public.is_pmp_editor());
create policy "Editors delete PMP media" on storage.objects for delete to authenticated using (bucket_id = 'pmp-media' and public.is_pmp_editor());

insert into public.categories (name,slug,display_order) values
('Faith & Purpose','faith-purpose',1),('Enterprise','enterprise',2),('Culture','culture',3),
('Leadership','leadership',4),('Creative Practice','creative-practice',5),('Community','community',6)
on conflict (slug) do nothing;
