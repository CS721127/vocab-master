-- Keep private vocabulary data out of anonymous Data API/GraphQL discovery.
revoke all on table public.lists, public.words from anon;

-- Keep RPC entry points authenticated-only; claim_ai_request remains SECURITY DEFINER
-- because it writes the private rate-limit table.
revoke all on function public.claim_ai_request() from public, anon;
grant execute on function public.claim_ai_request() to authenticated;
revoke all on function public.apply_ai_enhancements(jsonb) from public, anon;
grant execute on function public.apply_ai_enhancements(jsonb) to authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Use authenticated-only policies and init-plan-friendly auth.uid() calls.
drop policy if exists "Users can view their own lists" on public.lists;
drop policy if exists "Users can insert their own lists" on public.lists;
drop policy if exists "Users can update their own lists" on public.lists;
drop policy if exists "Users can delete their own lists" on public.lists;
create policy "Users can view their own lists" on public.lists
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own lists" on public.lists
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own lists" on public.lists
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own lists" on public.lists
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own words" on public.words;
drop policy if exists "Users can insert their own words" on public.words;
drop policy if exists "Users can update their own words" on public.words;
drop policy if exists "Users can delete their own words" on public.words;
create policy "Users can view their own words" on public.words
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own words" on public.words
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (list_id is null or exists (
      select 1 from public.lists
      where lists.id = words.list_id and lists.user_id = (select auth.uid())
    ))
  );
create policy "Users can update their own words" on public.words
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (list_id is null or exists (
      select 1 from public.lists
      where lists.id = words.list_id and lists.user_id = (select auth.uid())
    ))
  );
create policy "Users can delete their own words" on public.words
  for delete to authenticated using ((select auth.uid()) = user_id);
