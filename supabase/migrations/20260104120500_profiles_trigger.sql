-- Keep public.profiles in sync with auth.users

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  -- Ensure a default FREE subscription + entitlements exist.
  insert into public.subscriptions (user_id, plan, cycle, status, source, current_period_start, current_period_end)
  values (new.id, 'FREE', null, 'active', 'manual', now(), null)
  on conflict do nothing;

  insert into public.user_entitlements (user_id, plan, ai_daily_limit, topics_preview_only, can_custom_tests, can_mock_tests, can_grand_tests)
  values (new.id, 'FREE', 3, true, false, false, false)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


