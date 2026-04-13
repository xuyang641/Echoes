create table if not exists public.group_invitations (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, receiver_id)
);

alter table public.group_invitations enable row level security;

create policy "Users can view their own group invitations" on public.group_invitations
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send group invitations" on public.group_invitations
  for insert with check (auth.uid() = sender_id);

create policy "Receiver can update group invitation status" on public.group_invitations
  for update using (auth.uid() = receiver_id);

create policy "Sender can delete group invitations" on public.group_invitations
  for delete using (auth.uid() = sender_id);

-- Notify postgrest to reload schema cache
NOTIFY pgrst, 'reload config';