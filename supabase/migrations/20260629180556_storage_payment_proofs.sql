insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Files are stored at {user_id}/{timestamp}.{ext} -- the first path segment
-- is the uploader's own auth.uid(), enforced below.
create policy "users upload own payment proofs" on storage.objects
  for insert with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users view own payment proofs" on storage.objects
  for select using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
    )
  );

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "anyone can view blog images" on storage.objects
  for select using (bucket_id = 'blog-images');

create policy "admins manage blog images" on storage.objects
  for all using (
    bucket_id = 'blog-images'
    and exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  )
  with check (
    bucket_id = 'blog-images'
    and exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "anyone can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Files are stored at {user_id}/{timestamp}.{ext}.
create policy "users manage own avatar" on storage.objects
  for all using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
