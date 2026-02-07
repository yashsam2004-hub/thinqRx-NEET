-- Core schema for Pharmcards (GPAT SaaS)
-- NOTE: RLS is enabled and policies are defined for each table.

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (public mirror of auth.users with role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

-- Admin audit logs (immutable)
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  diff_json jsonb,
  created_at timestamptz not null default now()
);

-- Subscriptions (FREE/PRO only)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('FREE','PRO')),
  cycle text null check (cycle in ('monthly','half_yearly','yearly')),
  status text not null default 'active' check (status in ('active','past_due','canceled','expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz null,
  razorpay_subscription_id text unique,
  source text not null default 'manual' check (source in ('razorpay','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

-- Entitlements (materialized, can include overrides)
create table if not exists public.user_entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('FREE','PRO')),
  ai_daily_limit int not null default 3,
  topics_preview_only boolean not null default true,
  can_custom_tests boolean not null default false,
  can_mock_tests boolean not null default false,
  can_grand_tests boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Syllabus
create table if not exists public.syllabus_subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  "order" int not null default 0
);

create table if not exists public.syllabus_topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.syllabus_subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  "order" int not null default 0,
  is_free_preview boolean not null default false,
  guardrails text,
  unique(subject_id, slug)
);

create index if not exists syllabus_topics_subject_id_idx on public.syllabus_topics(subject_id);

-- AI notes/tests
create table if not exists public.ai_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.syllabus_topics(id) on delete cascade,
  content_json jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_notes_user_id_idx on public.ai_notes(user_id);
create index if not exists ai_notes_topic_id_idx on public.ai_notes(topic_id);

create table if not exists public.ai_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_ids uuid[] not null,
  params_json jsonb not null,
  content_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_tests_user_id_idx on public.ai_tests(user_id);

-- Mock/grand tests (admin uploaded)
create table if not exists public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('mock','grand')),
  title text not null,
  duration_minutes int not null default 180,
  question_count int not null default 125,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  subject text,
  topic text,
  question_text text not null,
  options jsonb not null,
  answer_key text not null,
  explanation text,
  marks int not null default 4,
  negative int not null default 1,
  "order" int not null default 0
);

create index if not exists mock_questions_test_id_idx on public.mock_questions(test_id);

-- Attempts & analytics
create table if not exists public.user_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('ai_topic','custom','mock','grand')),
  source_id uuid,
  score int,
  time_taken_seconds int,
  responses_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_attempts_user_id_idx on public.user_attempts(user_id);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  event_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);

-- CMS
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  content_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  alt text,
  created_at timestamptz not null default now()
);

-- Helper functions
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_entitlements_updated_at on public.user_entitlements;
create trigger trg_entitlements_updated_at
before update on public.user_entitlements
for each row execute function public.set_updated_at();

drop trigger if exists trg_cms_pages_updated_at on public.cms_pages;
create trigger trg_cms_pages_updated_at
before update on public.cms_pages
for each row execute function public.set_updated_at();

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.syllabus_subjects enable row level security;
alter table public.syllabus_topics enable row level security;
alter table public.ai_notes enable row level security;
alter table public.ai_tests enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_questions enable row level security;
alter table public.user_attempts enable row level security;
alter table public.analytics_events enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_assets enable row level security;

-- Policies
-- profiles: user can view own row; admin can view all. Updates only admin (role/email).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin"
on public.profiles for insert
with check (public.is_admin());

-- admin_audit_logs: admin can insert and select
drop policy if exists "audit_select_admin" on public.admin_audit_logs;
create policy "audit_select_admin"
on public.admin_audit_logs for select
using (public.is_admin());

drop policy if exists "audit_insert_admin" on public.admin_audit_logs;
create policy "audit_insert_admin"
on public.admin_audit_logs for insert
with check (public.is_admin());

-- subscriptions: user can select own; admin can manage
drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin"
on public.subscriptions for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "subscriptions_insert_admin" on public.subscriptions;
create policy "subscriptions_insert_admin"
on public.subscriptions for insert
with check (public.is_admin());

drop policy if exists "subscriptions_update_admin" on public.subscriptions;
create policy "subscriptions_update_admin"
on public.subscriptions for update
using (public.is_admin())
with check (public.is_admin());

-- entitlements: user can select own; admin can manage
drop policy if exists "entitlements_select_own_or_admin" on public.user_entitlements;
create policy "entitlements_select_own_or_admin"
on public.user_entitlements for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "entitlements_insert_admin" on public.user_entitlements;
create policy "entitlements_insert_admin"
on public.user_entitlements for insert
with check (public.is_admin());

drop policy if exists "entitlements_update_admin" on public.user_entitlements;
create policy "entitlements_update_admin"
on public.user_entitlements for update
using (public.is_admin())
with check (public.is_admin());

-- syllabus: everyone can read; admin can write
drop policy if exists "syllabus_subjects_select_all" on public.syllabus_subjects;
create policy "syllabus_subjects_select_all"
on public.syllabus_subjects for select
using (true);

drop policy if exists "syllabus_subjects_write_admin" on public.syllabus_subjects;
create policy "syllabus_subjects_write_admin"
on public.syllabus_subjects for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "syllabus_topics_select_all" on public.syllabus_topics;
create policy "syllabus_topics_select_all"
on public.syllabus_topics for select
using (true);

drop policy if exists "syllabus_topics_write_admin" on public.syllabus_topics;
create policy "syllabus_topics_write_admin"
on public.syllabus_topics for all
using (public.is_admin())
with check (public.is_admin());

-- ai_notes: user owns; admin can read
drop policy if exists "ai_notes_select_own_or_admin" on public.ai_notes;
create policy "ai_notes_select_own_or_admin"
on public.ai_notes for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_notes_insert_own" on public.ai_notes;
create policy "ai_notes_insert_own"
on public.ai_notes for insert
with check (user_id = auth.uid());

-- ai_tests: user owns; admin can read
drop policy if exists "ai_tests_select_own_or_admin" on public.ai_tests;
create policy "ai_tests_select_own_or_admin"
on public.ai_tests for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_tests_insert_own" on public.ai_tests;
create policy "ai_tests_insert_own"
on public.ai_tests for insert
with check (user_id = auth.uid());

-- mock tests/questions: students can read published only; admin can manage
drop policy if exists "mock_tests_select_published_or_admin" on public.mock_tests;
create policy "mock_tests_select_published_or_admin"
on public.mock_tests for select
using (published = true or public.is_admin());

drop policy if exists "mock_tests_write_admin" on public.mock_tests;
create policy "mock_tests_write_admin"
on public.mock_tests for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "mock_questions_select_published_or_admin" on public.mock_questions;
create policy "mock_questions_select_published_or_admin"
on public.mock_questions for select
using (
  public.is_admin()
  or exists (
    select 1 from public.mock_tests t
    where t.id = mock_questions.test_id and t.published = true
  )
);

drop policy if exists "mock_questions_write_admin" on public.mock_questions;
create policy "mock_questions_write_admin"
on public.mock_questions for all
using (public.is_admin())
with check (public.is_admin());

-- user_attempts: user owns; admin can read
drop policy if exists "attempts_select_own_or_admin" on public.user_attempts;
create policy "attempts_select_own_or_admin"
on public.user_attempts for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "attempts_insert_own" on public.user_attempts;
create policy "attempts_insert_own"
on public.user_attempts for insert
with check (user_id = auth.uid());

-- analytics_events: user can insert for self (or null); admin can read
drop policy if exists "analytics_insert_self_or_anon" on public.analytics_events;
create policy "analytics_insert_self_or_anon"
on public.analytics_events for insert
with check (user_id = auth.uid() or user_id is null);

drop policy if exists "analytics_select_admin" on public.analytics_events;
create policy "analytics_select_admin"
on public.analytics_events for select
using (public.is_admin());

-- cms: everyone can read pages; admin can write; assets are admin-only for now
drop policy if exists "cms_pages_select_all" on public.cms_pages;
create policy "cms_pages_select_all"
on public.cms_pages for select
using (true);

drop policy if exists "cms_pages_write_admin" on public.cms_pages;
create policy "cms_pages_write_admin"
on public.cms_pages for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "cms_assets_select_admin" on public.cms_assets;
create policy "cms_assets_select_admin"
on public.cms_assets for select
using (public.is_admin());

drop policy if exists "cms_assets_write_admin" on public.cms_assets;
create policy "cms_assets_write_admin"
on public.cms_assets for all
using (public.is_admin())
with check (public.is_admin());


