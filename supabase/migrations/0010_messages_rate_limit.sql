-- Round 21 — Per-IP rate limit on anonymous message inserts.
--
-- Strategy: a small rate-tracking table with a 1-hour rolling window
-- and a BEFORE INSERT trigger that rejects if 3+ inserts already happened
-- from the same IP in the last hour. Anon inserts only — admins bypass
-- via the existing public.is_admin() SECURITY INVOKER gate.
--
-- The IP is read from PostgREST's `request.headers` GUC (X-Forwarded-For).
-- When the header is missing (e.g. direct DB calls or unusual proxy setups)
-- the function falls back to the literal string 'unknown', which still
-- enforces a global 3/hr cap on those orphan paths.

create table if not exists public.message_rate_limit (
  ip text not null,
  inserted_at timestamptz not null default now()
);

create index if not exists message_rate_limit_ip_time
  on public.message_rate_limit (ip, inserted_at desc);

alter table public.message_rate_limit enable row level security;
-- No public select/insert/update/delete policies. Only the SECURITY DEFINER
-- functions below mutate this table. RLS-enabled with no policies = locked.

create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_ip text := coalesce(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  );
  recent_count int;
begin
  -- Skip rate limit for authenticated admins (allowlist-gated by is_admin()).
  if public.is_admin() then
    return new;
  end if;

  select count(*) into recent_count
  from public.message_rate_limit
  where ip = client_ip
    and inserted_at > now() - interval '1 hour';

  if recent_count >= 3 then
    raise exception 'rate_limited' using errcode = '42501';
  end if;

  insert into public.message_rate_limit (ip) values (client_ip);
  return new;
end;
$$;

drop trigger if exists messages_rate_limit_trigger on public.messages;
create trigger messages_rate_limit_trigger
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();

-- Garbage collection: prune rows older than 24h on each statement.
-- This is cheap because the (ip, inserted_at desc) index covers the prune
-- predicate too.
create or replace function public.prune_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.message_rate_limit
  where inserted_at < now() - interval '24 hours';
  return new;
end;
$$;

drop trigger if exists messages_rate_limit_gc on public.messages;
create trigger messages_rate_limit_gc
  after insert on public.messages
  for each statement execute function public.prune_message_rate_limit();
