-- Additive migration. Run once in the existing Supabase SQL editor before release.
-- No vocabulary data is deleted or rewritten.
create index if not exists words_user_created_idx on public.words (user_id, created_at desc);
create index if not exists words_list_idx on public.words (list_id);
create index if not exists lists_user_idx on public.lists (user_id);

-- Prevent assigning a word to another user's list, even with a crafted client request.
drop policy if exists "Users can insert their own words" on public.words;
create policy "Users can insert their own words" on public.words for insert to authenticated
with check (auth.uid() = user_id and (list_id is null or exists (select 1 from public.lists where id = list_id and user_id = auth.uid())));
drop policy if exists "Users can update their own words" on public.words;
create policy "Users can update their own words" on public.words for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and (list_id is null or exists (select 1 from public.lists where id = list_id and user_id = auth.uid())));

-- A database-backed limit survives serverless cold starts and concurrent instances.
create table if not exists public.ai_request_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  requests integer not null default 0
);
alter table public.ai_request_limits enable row level security;
revoke all on public.ai_request_limits from anon, authenticated;
create or replace function public.claim_ai_request() returns boolean
language plpgsql security definer set search_path = '' as $$
declare current_count integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_request_limits as limits (user_id, window_start, requests)
  values (auth.uid(), now(), 1)
  on conflict (user_id) do update set
    requests = case when limits.window_start < now() - interval '1 minute' then 1 else limits.requests + 1 end,
    window_start = case when limits.window_start < now() - interval '1 minute' then now() else limits.window_start end
  returning requests into current_count;
  return current_count <= 5;
end;
$$;
revoke all on function public.claim_ai_request() from public;
grant execute on function public.claim_ai_request() to authenticated;

-- Apply a complete AI batch in one transaction; stale/deleted rows roll it back.
create or replace function public.apply_ai_enhancements(entries jsonb) returns setof public.words
language plpgsql security invoker set search_path = '' as $$
declare expected integer; updated integer;
begin
  if auth.uid() is null or jsonb_typeof(entries) <> 'array' then raise exception 'Invalid batch'; end if;
  expected := jsonb_array_length(entries);
  if expected < 1 or expected > 10 or exists (
    select 1 from jsonb_to_recordset(entries) as e(id uuid, definition text, example text)
    where e.id is null or nullif(trim(e.definition), '') is null or nullif(trim(e.example), '') is null
      or length(e.definition) > 4000 or length(e.example) > 4000
  ) then raise exception 'Invalid batch'; end if;
  return query update public.words as w set definition = e.definition, example = e.example
    from jsonb_to_recordset(entries) as e(id uuid, definition text, example text)
    where w.id = e.id and w.user_id = auth.uid() returning w.*;
  get diagnostics updated = row_count;
  if updated <> expected then raise exception 'Collection changed; retry'; end if;
end;
$$;
revoke all on function public.apply_ai_enhancements(jsonb) from public;
grant execute on function public.apply_ai_enhancements(jsonb) to authenticated;
