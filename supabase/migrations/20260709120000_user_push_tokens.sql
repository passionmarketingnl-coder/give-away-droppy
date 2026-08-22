-- User push tokens: één rij per uniek device/token, gekoppeld aan user_id.
-- Wordt gebruikt door de send-push edge function om notifications
-- naar alle actieve devices van een user te sturen via Expo Push API.

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_push_tokens_token_key
  on public.user_push_tokens (token);

create index if not exists user_push_tokens_user_id_idx
  on public.user_push_tokens (user_id);

alter table public.user_push_tokens enable row level security;

-- Users mogen hun eigen tokens opslaan en verwijderen (bijv. bij logout).
-- SELECT is beperkt tot eigen tokens (edge function gebruikt service role).

drop policy if exists "users can insert their own tokens" on public.user_push_tokens;
create policy "users can insert their own tokens"
  on public.user_push_tokens
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users can update their own tokens" on public.user_push_tokens;
create policy "users can update their own tokens"
  on public.user_push_tokens
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users can see their own tokens" on public.user_push_tokens;
create policy "users can see their own tokens"
  on public.user_push_tokens
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can delete their own tokens" on public.user_push_tokens;
create policy "users can delete their own tokens"
  on public.user_push_tokens
  for delete to authenticated
  using (user_id = auth.uid());
