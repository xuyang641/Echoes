-- STEP 1: Create Tables First (Dependency Order)
-- 1. Profiles (No dependencies)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  username text,
  is_pro boolean default false,
  pro_since timestamptz,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- 2. Groups (No dependencies)
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  invite_code text unique,
  color text,
  created_by uuid references auth.users not null
);
alter table public.groups enable row level security;

-- 3. Group Members (Depends on Groups)
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member',
  unique(group_id, user_id)
);
alter table public.group_members enable row level security;

-- 4. Diary Entries (Depends on Group Members for policy logic)
create table if not exists public.diary_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  date text not null,
  photo_url text,
  caption text,
  mood text,
  location jsonb,
  tags text[],
  ai_tags text[],
  palette text[],
  group_id uuid,
  likes text[],
  comments jsonb[]
);
alter table public.diary_entries enable row level security;

-- 5. Friend Requests
create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  sender_id uuid references auth.users on delete cascade not null,
  receiver_id uuid references auth.users on delete cascade not null,
  status text default 'pending',
  unique(sender_id, receiver_id)
);
alter table public.friend_requests enable row level security;

-- 6. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  sender_id uuid references auth.users,
  type text not null,
  data jsonb,
  read boolean default false
);
alter table public.notifications enable row level security;

-- 7. Shared Books
create table if not exists public.shared_books (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  year text,
  style text,
  pages jsonb
);
alter table public.shared_books enable row level security;

-- 8. Transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users on delete cascade not null,
  provider text,
  amount text,
  trade_no text,
  status text,
  metadata jsonb
);
alter table public.transactions enable row level security;


-- STEP 2: Create Policies (Now all tables exist)

-- Profiles Policies
do $$ begin
  create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- Groups Policies
do $$ begin
  create policy "Members can view groups" on public.groups for select using (
    exists (select 1 from public.group_members where group_id = groups.id and user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can create groups" on public.groups for insert with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

-- Group Members Policies
do $$ begin
  create policy "View members" on public.group_members for select using (
    exists (select 1 from public.group_members as gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Join group" on public.group_members for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Diary Entries Policies (Now group_members exists!)
do $$ begin
  create policy "Users can CRUD their own entries" on public.diary_entries for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Group members can view entries" on public.diary_entries for select using (
    exists (select 1 from public.group_members where group_id = diary_entries.group_id and user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

-- Friend Requests Policies
do $$ begin
  create policy "View requests" on public.friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Send request" on public.friend_requests for insert with check (auth.uid() = sender_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Update request" on public.friend_requests for update using (auth.uid() = receiver_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Delete request" on public.friend_requests for delete using (auth.uid() = sender_id or auth.uid() = receiver_id);
exception when duplicate_object then null; end $$;

-- Notifications Policies
do $$ begin
  create policy "View notifications" on public.notifications for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Insert notifications" on public.notifications for insert with check (true);
exception when duplicate_object then null; end $$;

-- Shared Books Policies
do $$ begin
  create policy "View books" on public.shared_books for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Create books" on public.shared_books for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Transactions Policies
do $$ begin
  create policy "View transactions" on public.transactions for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;


-- STEP 3: Storage & Triggers

-- Storage Buckets
insert into storage.buckets (id, name, public) values ('entries', 'entries', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

do $$ begin
  create policy "Public Access Entries" on storage.objects for select using (bucket_id = 'entries');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Upload Entries" on storage.objects for insert with check (bucket_id = 'entries' and auth.uid() = owner);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Update Entries" on storage.objects for update using (bucket_id = 'entries' and auth.uid() = owner);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Delete Entries" on storage.objects for delete using (bucket_id = 'entries' and auth.uid() = owner);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public Access Avatars" on storage.objects for select using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Upload Avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() = owner);
exception when duplicate_object then null; end $$;

-- Triggers
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
