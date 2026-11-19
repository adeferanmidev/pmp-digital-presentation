# Photographing Monumental People

**Stories Behind the People. Lessons Beyond the Journey.**

A photography-led digital magazine and publishing platform preserving human stories through intentional portraiture and considered conversations.

## Current build
- Editorial homepage, responsive navigation, story discovery, category filters and search
- Individual story pages with cover image, introduction, editorial content and return navigation
- Editorial sign-in at `/admin`
- Create, edit, publish, unpublish and delete stories
- Cover photograph uploads to Supabase Storage
- Supabase Postgres schema with separate editor access grants and row-level security
- Demo content is clearly temporary and must be replaced with approved PMP stories

## Stack
React, TypeScript, Vite, Supabase Auth/Postgres/Storage, Cloudflare Pages.

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Use only the Supabase publishable key (or legacy anon key) in the browser. Never expose a service-role or secret key.

## Database and first editor
The initial database migration is in `supabase/schema.sql`. It has already been applied to the PMP Supabase project.

To grant the first editor:
1. Create the editor's user in Supabase Authentication.
2. Copy that user's UUID.
3. In the Supabase SQL Editor, run:
```sql
insert into public.editor_users (user_id)
values ('PASTE_AUTH_USER_UUID_HERE')
on conflict (user_id) do nothing;
```
Only users listed in `editor_users` can manage stories or upload media. Do not grant editor access to public visitors.

## Cloudflare Pages
Build command: `npm run build`
Output directory: `dist`
Add the two public Supabase environment variables above in the Pages project settings.

## Editorial integrity
Pastor Steve Ogah is a proposed feature only. Do not publish a feature or imply his endorsement until he explicitly confirms participation.
