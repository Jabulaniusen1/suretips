-- Every admin-check policy used `exists (select 1 from public.users u where
-- u.id = auth.uid() and u.is_admin = true)` inline, including on the `users`
-- table's own SELECT policy. That self-reference recurses: evaluating the
-- `users` SELECT policy runs a query against `users`, which re-evaluates the
-- same SELECT policy, forever ("infinite recursion detected in policy for
-- relation users"). Since every other table's admin-check subquery is itself
-- a SELECT against `users`, the recursion wasn't limited to the users table
-- -- it broke every admin-gated policy in the schema.
--
-- Fix: a SECURITY DEFINER function runs as its owner (the migration role,
-- which owns the tables), and table owners bypass RLS by default. So
-- `is_admin()` can safely query `public.users` without re-triggering RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = auth.uid() and is_admin = true);
$$;

-- ---------- users ----------
drop policy if exists "users can view own profile" on public.users;
create policy "users can view own profile" on public.users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "admins can update any profile" on public.users;
create policy "admins can update any profile" on public.users
  for update using (public.is_admin());

-- ---------- plans / plan_prices ----------
drop policy if exists "anyone can view active plans" on public.plans;
create policy "anyone can view active plans" on public.plans
  for select using (is_active = true or public.is_admin());

drop policy if exists "admins manage plans" on public.plans;
create policy "admins manage plans" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage plan prices" on public.plan_prices;
create policy "admins manage plan prices" on public.plan_prices
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- user_subscriptions ----------
drop policy if exists "users view own subscriptions" on public.user_subscriptions;
create policy "users view own subscriptions" on public.user_subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage subscriptions" on public.user_subscriptions;
create policy "admins manage subscriptions" on public.user_subscriptions
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- predictions / vip_winnings ----------
drop policy if exists "admins manage predictions" on public.predictions;
create policy "admins manage predictions" on public.predictions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage vip winnings" on public.vip_winnings;
create policy "admins manage vip winnings" on public.vip_winnings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- payment_methods / transactions ----------
drop policy if exists "authenticated users view active payment methods" on public.payment_methods;
create policy "authenticated users view active payment methods" on public.payment_methods
  for select using ((is_active = true and auth.uid() is not null) or public.is_admin());

drop policy if exists "admins manage payment methods" on public.payment_methods;
create policy "admins manage payment methods" on public.payment_methods
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users view own transactions" on public.transactions;
create policy "users view own transactions" on public.transactions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins update transactions" on public.transactions;
create policy "admins update transactions" on public.transactions
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- content / CMS ----------
drop policy if exists "anyone can view published blog posts" on public.blog_posts;
create policy "anyone can view published blog posts" on public.blog_posts
  for select using ((published = true and published_at <= now()) or public.is_admin());

drop policy if exists "admins manage blog posts" on public.blog_posts;
create policy "admins manage blog posts" on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can view active competitions" on public.competitions;
create policy "anyone can view active competitions" on public.competitions
  for select using (status = 'active' or public.is_admin());

drop policy if exists "admins manage competitions" on public.competitions;
create policy "admins manage competitions" on public.competitions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can view published custom pages" on public.custom_pages;
create policy "anyone can view published custom pages" on public.custom_pages
  for select using (is_published = true or public.is_admin());

drop policy if exists "admins manage custom pages" on public.custom_pages;
create policy "admins manage custom pages" on public.custom_pages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage site config" on public.site_config;
create policy "admins manage site config" on public.site_config
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can view active ad links" on public.ad_links;
create policy "anyone can view active ad links" on public.ad_links
  for select using (is_active = true or public.is_admin());

drop policy if exists "admins manage ad links" on public.ad_links;
create policy "admins manage ad links" on public.ad_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- notifications / chat ----------
drop policy if exists "users view own notifications" on public.notifications;
create policy "users view own notifications" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users view own conversation" on public.messages;
create policy "users view own conversation" on public.messages
  for select using (user_id = auth.uid() or sender_id = auth.uid() or public.is_admin());

drop policy if exists "users mark own messages read" on public.messages;
create policy "users mark own messages read" on public.messages
  for update using (user_id = auth.uid() or public.is_admin());

-- ---------- storage ----------
drop policy if exists "users view own payment proofs" on storage.objects;
create policy "users view own payment proofs" on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "admins manage blog images" on storage.objects;
create policy "admins manage blog images" on storage.objects
  for all using (bucket_id = 'blog-images' and public.is_admin())
  with check (bucket_id = 'blog-images' and public.is_admin());
