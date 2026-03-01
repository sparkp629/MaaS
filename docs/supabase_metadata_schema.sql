-- Supabase schema for metadata-only storage (no raw post body persistence)
-- Run inside Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.kol_profiles (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  handle text not null,
  display_name text not null,
  country_code text not null,
  niche text not null,
  language_code text not null default 'en',
  is_premium_source boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle, country_code, niche)
);

create table if not exists public.social_content_metadata (
  id uuid primary key default gen_random_uuid(),
  kol_profile_id uuid references public.kol_profiles(id) on delete cascade,
  platform text not null,
  platform_content_id text not null,
  canonical_url text not null,
  country_code text not null,
  niche text not null,
  language_code text not null default 'en',
  views_count bigint not null default 0,
  likes_count bigint not null default 0,
  reposts_count bigint not null default 0,
  comments_count bigint not null default 0,
  bookmarks_count bigint not null default 0,
  quote_count bigint not null default 0,
  engagement_rate numeric(8,4) not null default 0,
  is_visible boolean not null default true,
  visibility_reason text,
  content_fingerprint text,
  summary text,
  source_collected_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, platform_content_id)
);

create index if not exists idx_social_content_country_niche
  on public.social_content_metadata(country_code, niche, engagement_rate desc);
create index if not exists idx_social_content_visible
  on public.social_content_metadata(is_visible, last_seen_at desc);

create table if not exists public.substack_premium_snapshots (
  id uuid primary key default gen_random_uuid(),
  publication text not null,
  post_url text not null,
  title text not null,
  short_summary text,
  country_code text not null,
  niche text not null,
  is_visible boolean not null default true,
  fetched_at timestamptz not null default now(),
  unique (publication, post_url)
);

-- Optional: materialized view for top KOL extraction previews.
create materialized view if not exists public.top_kol_preview as
select
  m.country_code,
  m.niche,
  p.display_name,
  p.handle,
  avg(m.engagement_rate) as avg_engagement_rate,
  sum(m.comments_count) as comments_total,
  sum(m.reposts_count) as reposts_total
from public.social_content_metadata m
join public.kol_profiles p on p.id = m.kol_profile_id
where m.is_visible = true
group by m.country_code, m.niche, p.display_name, p.handle;

-- Realtime publication (dashboard live updates when is_visible changes).
alter publication supabase_realtime add table public.social_content_metadata;
alter publication supabase_realtime add table public.substack_premium_snapshots;

-- Basic RLS setup
alter table public.kol_profiles enable row level security;
alter table public.social_content_metadata enable row level security;
alter table public.substack_premium_snapshots enable row level security;

-- Public read for non-sensitive metadata tables.
create policy if not exists "public_read_kol_profiles"
  on public.kol_profiles for select using (true);

create policy if not exists "public_read_social_metadata"
  on public.social_content_metadata for select using (true);

-- Premium-only access for Substack snapshots.
-- Replace function or claim path with your own billing entitlement signal.
create policy if not exists "premium_read_substack_snapshots"
  on public.substack_premium_snapshots
  for select
  using (coalesce((auth.jwt() ->> 'plan'), '') = 'premium');

-- ---------------------------------------------------------------------------
-- Knowledge base for RAG copywriting (TXT/PDF/DOCX + vectors + visual assets)
-- ---------------------------------------------------------------------------

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  sqlite_id bigint not null unique,
  file_path text not null unique,
  source_type text not null,
  topic text,
  relevance_score integer not null default 0,
  include_in_scope boolean not null default false,
  extraction_status text not null default 'pending',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  sqlite_id bigint not null unique,
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_index integer not null,
  text_content text not null,
  token_estimate integer not null default 0,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create table if not exists public.knowledge_vectors (
  id uuid primary key default gen_random_uuid(),
  sqlite_id bigint not null unique,
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_id uuid not null references public.knowledge_chunks(id) on delete cascade,
  embedding_model text not null,
  embedding_dims integer not null default 0,
  embedding_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (chunk_id, embedding_model)
);

create index if not exists idx_knowledge_sources_scope
  on public.knowledge_sources(include_in_scope, source_type, relevance_score desc);

create index if not exists idx_knowledge_chunks_source
  on public.knowledge_chunks(source_id, chunk_index);

create index if not exists idx_knowledge_vectors_source
  on public.knowledge_vectors(source_id, chunk_id);

alter publication supabase_realtime add table public.knowledge_sources;
alter publication supabase_realtime add table public.knowledge_chunks;
alter publication supabase_realtime add table public.knowledge_vectors;

alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_vectors enable row level security;

create policy if not exists "public_read_knowledge_sources"
  on public.knowledge_sources for select using (true);

create policy if not exists "public_read_knowledge_chunks"
  on public.knowledge_chunks for select using (true);

create policy if not exists "public_read_knowledge_vectors"
  on public.knowledge_vectors for select using (true);

-- Dev-friendly write policies (replace with service-role only in production).
create policy if not exists "public_write_knowledge_sources"
  on public.knowledge_sources
  for all
  using (true)
  with check (true);

create policy if not exists "public_write_knowledge_chunks"
  on public.knowledge_chunks
  for all
  using (true)
  with check (true);

create policy if not exists "public_write_knowledge_vectors"
  on public.knowledge_vectors
  for all
  using (true)
  with check (true);
