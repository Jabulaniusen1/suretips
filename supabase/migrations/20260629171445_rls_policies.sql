-- Every admin-only policy uses this exact subquery shape so it's trivial to
-- copy when adding a new table:
--   exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
--
-- Predictions and vip_winnings are publicly SELECT-able at the DB level --
-- the paywall is enforced by the application's queries (row-count limits and
-- column selection when a plan is locked), not by hiding the rows entirely.
-- This mirrors how the reference implementation works and is intentional:
-- the data itself isn't sensitive, only "how much of it you get for free" is
-- the product.
--
-- No SUPABASE_SERVICE_ROLE_KEY is used anywhere in the app. All mutations
-- happen under the acting user's own session, so policies below are written
-- to be safe for a logged-in non-admin user to call directly (e.g. a user
-- can INSERT a 'pending' subscription/transaction for themselves, but
-- cannot mark themselves 'active' or 'completed' -- only an admin row can).

-- ---------- users ----------
create policy "users can view own profile" on public.users
  for select using (
    auth.uid() = id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "users can update own profile" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = false);

create policy "admins can update any profile" on public.users
  for update using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

-- ---------- plans / plan_prices ----------
create policy "anyone can view active plans" on public.plans
  for select using (is_active = true or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "admins manage plans" on public.plans
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view plan prices" on public.plan_prices
  for select using (true);

create policy "admins manage plan prices" on public.plan_prices
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ---------- user_subscriptions ----------
create policy "users view own subscriptions" on public.user_subscriptions
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "users create own pending subscription" on public.user_subscriptions
  for insert with check (
    user_id = auth.uid()
    and plan_status in ('inactive', 'pending')
    and subscription_fee_paid = false
    and activation_fee_paid = false
  );

create policy "admins manage subscriptions" on public.user_subscriptions
  for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- Lets a user re-request a renewal on a plan they already have a row for
-- (expired/inactive/rejected) without being able to self-activate -- same
-- constraints as the insert policy above.
create policy "users request own renewal" on public.user_subscriptions
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and plan_status = 'pending'
    and subscription_fee_paid = false
    and activation_fee_paid = false
  );

-- ---------- predictions / vip_winnings ----------
create policy "anyone can view predictions" on public.predictions
  for select using (true);

create policy "admins manage predictions" on public.predictions
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view vip winnings" on public.vip_winnings
  for select using (true);

create policy "admins manage vip winnings" on public.vip_winnings
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ---------- payment_methods / transactions ----------
create policy "authenticated users view active payment methods" on public.payment_methods
  for select using (
    (is_active = true and auth.uid() is not null)
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "admins manage payment methods" on public.payment_methods
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "users view own transactions" on public.transactions
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "users create own pending transaction" on public.transactions
  for insert with check (user_id = auth.uid() and status = 'pending');

create policy "admins update transactions" on public.transactions
  for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ---------- content / CMS ----------
create policy "anyone can view published blog posts" on public.blog_posts
  for select using (
    (published = true and published_at <= now())
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "admins manage blog posts" on public.blog_posts
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view active competitions" on public.competitions
  for select using (status = 'active' or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "admins manage competitions" on public.competitions
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view published custom pages" on public.custom_pages
  for select using (is_published = true or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "admins manage custom pages" on public.custom_pages
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view site config" on public.site_config
  for select using (true);

create policy "admins manage site config" on public.site_config
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "anyone can view active ad links" on public.ad_links
  for select using (is_active = true or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

create policy "admins manage ad links" on public.ad_links
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ---------- notifications / chat / free games ----------
create policy "users view own notifications" on public.notifications
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "authenticated users create notifications" on public.notifications
  for insert with check (auth.uid() is not null);

create policy "users mark own notifications read" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users view own conversation" on public.messages
  for select using (
    user_id = auth.uid()
    or sender_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "authenticated users send messages" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "users mark own messages read" on public.messages
  for update using (
    user_id = auth.uid()
    or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

create policy "anyone can view free games entries" on public.free_games_entries
  for select using (true);

create policy "users manage own free games entry" on public.free_games_entries
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
