-- BKM DIGITAL
-- Published websites, online shops, and software briefs.
-- Safe to run more than once.

create table if not exists public.studio_documents (
  id uuid primary key default gen_random_uuid(),
  project_id text,
  kind text not null check (kind in ('website', 'shop', 'software')),
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_documents_kind_idx
  on public.studio_documents(kind, created_at desc);

create index if not exists studio_documents_project_id_idx
  on public.studio_documents(project_id);

alter table public.studio_documents enable row level security;

drop policy if exists "Public can view studio documents" on public.studio_documents;
create policy "Public can view studio documents"
  on public.studio_documents for select to public using (true);

drop policy if exists "Public can insert studio documents" on public.studio_documents;
create policy "Public can insert studio documents"
  on public.studio_documents for insert to public with check (true);

drop policy if exists "Public can update studio documents" on public.studio_documents;
create policy "Public can update studio documents"
  on public.studio_documents for update to public using (true) with check (true);

drop policy if exists "Public can delete studio documents" on public.studio_documents;
create policy "Public can delete studio documents"
  on public.studio_documents for delete to public using (true);
