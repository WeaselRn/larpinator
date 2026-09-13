-- ============================================================================
-- Larpinator — 001: initial schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- BEFORE starting the app. Then run 002_seed.sql.
--
-- Auth is handled by Clerk. All application access flows through the Next.js
-- server using the service-role key. RLS is enabled with no anon policies,
-- so the publishable/anon key can read and write nothing.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================== profiles ====================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  username text not null unique,
  avatar_url text,
  overall_larp_score numeric(5,2) not null default 0,
  larp_tier text not null default 'NPC',
  category_scores jsonb not null default '{}'::jsonb,
  xp integer not null default 0,
  streak integer not null default 0,
  last_daily_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_overall_idx on public.profiles (overall_larp_score desc);
create index if not exists profiles_streak_idx on public.profiles (streak desc);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================== analyses ====================================
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('cv', 'github', 'music', 'combined', 'quiz', 'daily', 'battle')),
  score numeric(5,2) not null,
  category_scores jsonb not null default '{}'::jsonb,
  roast text not null default '',
  improvements jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  raw_result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_type_idx on public.analyses (user_id, type, created_at desc);
create index if not exists analyses_created_idx on public.analyses (created_at desc);

-- ============================ quiz_questions ================================
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  difficulty text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_category_idx on public.quiz_questions (category) where active;

-- ============================= quiz_attempts ================================
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(5,2) not null,
  larp_score numeric(5,2) not null,
  category text not null default 'mixed',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, larp_score desc);

-- ============================== daily_larps =================================
create table if not exists public.daily_larps (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========================== daily_larp_attempts =============================
create table if not exists public.daily_larp_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_larp_id uuid not null references public.daily_larps(id) on delete cascade,
  response text not null,
  larp_score numeric(5,2) not null,
  roast text not null default '',
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_attempts_challenge_idx on public.daily_larp_attempts (daily_larp_id, larp_score desc);
create index if not exists daily_attempts_user_idx on public.daily_larp_attempts (user_id, created_at desc);

-- ================================ battles ===================================
create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  player_one_id uuid not null references public.profiles(id) on delete cascade,
  player_two_id uuid references public.profiles(id) on delete set null,
  player_one_name text not null,
  player_two_name text not null,
  player_one_score numeric(5,2) not null,
  player_two_score numeric(5,2) not null,
  winner_id uuid references public.profiles(id) on delete set null,
  verdict text not null default '',
  raw_result jsonb,
  created_at timestamptz not null default now()
);

create index if not exists battles_winner_idx on public.battles (winner_id);

-- ============================== achievements ================================
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  icon text not null
);

-- ============================ user_achievements =============================
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists user_achievements_user_idx on public.user_achievements (user_id);

-- ================================ views =====================================
-- Leaderboards derive from stored scores. Nothing is manually maintained.

create or replace view public.leaderboard_entries as
select
  p.id,
  p.username,
  p.avatar_url,
  p.overall_larp_score,
  p.larp_tier,
  coalesce((p.category_scores ->> 'aura')::numeric, 0) as aura,
  coalesce((p.category_scores ->> 'cringe')::numeric, 0) as cringe,
  coalesce((p.category_scores ->> 'buzzword')::numeric, 0) as buzzword
from public.profiles p
where exists (select 1 from public.analyses a where a.user_id = p.id);

create or replace view public.leaderboard_quiz as
select
  p.id,
  p.username,
  p.avatar_url,
  p.larp_tier,
  max(q.larp_score) as value
from public.quiz_attempts q
join public.profiles p on p.id = q.user_id
group by p.id, p.username, p.avatar_url, p.larp_tier;

create or replace view public.leaderboard_battle as
select
  p.id,
  p.username,
  p.avatar_url,
  p.larp_tier,
  count(*)::numeric as value
from public.battles b
join public.profiles p on p.id = b.winner_id
group by p.id, p.username, p.avatar_url, p.larp_tier;

create or replace view public.leaderboard_daily as
select
  p.id,
  p.username,
  p.avatar_url,
  p.larp_tier,
  max(d.larp_score) as value
from public.daily_larp_attempts d
join public.profiles p on p.id = d.user_id
group by p.id, p.username, p.avatar_url, p.larp_tier;

grant select on public.leaderboard_entries, public.leaderboard_quiz, public.leaderboard_battle, public.leaderboard_daily to service_role;

-- ================================= RLS ======================================
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.daily_larps enable row level security;
alter table public.daily_larp_attempts enable row level security;
alter table public.battles enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Intentionally NO policies for anon/authenticated: every read/write goes
-- through the Next.js server (service-role key, which bypasses RLS).
-- If you later wire Clerk into Supabase as a third-party auth provider you
-- can add JWT-based policies here.
