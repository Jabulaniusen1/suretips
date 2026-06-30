-- Auto-create a public.users profile row whenever someone signs up via
-- Supabase Auth. security definer so it can write to public.users despite
-- the inserting "role" being the anon/auth signup flow, not the new user's
-- own session yet.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, country)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'country', 'Nigeria')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger user_subscriptions_set_updated_at before update on public.user_subscriptions
  for each row execute function public.set_updated_at();
create trigger predictions_set_updated_at before update on public.predictions
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger blog_posts_set_updated_at before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- Lets the blog post page increment view_count without granting UPDATE on
-- the whole row to anonymous readers.
create or replace function public.increment_blog_post_views(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts set view_count = view_count + 1 where id = post_id;
$$;
