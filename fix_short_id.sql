-- =========================================================
-- 🛠️ 修复脚本：为所有缺失的用户生成 Short ID
-- =========================================================

-- 1. 强制为所有 profiles 生成 short_id（如果为 NULL）
update public.profiles
set short_id = upper(substring(md5(random()::text) from 1 for 6))
where short_id is null;

-- 2. 确保 short_id 列有唯一约束
do $$
begin
  if not exists (select 1 from information_schema.table_constraints where table_name = 'profiles' and constraint_name = 'profiles_short_id_key') then
    alter table public.profiles add constraint profiles_short_id_key unique (short_id);
  end if;
end $$;

-- 3. 检查并修复触发器（确保以后新注册的用户能自动获得 ID）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, short_id)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    -- 生成 6 位随机大写 ID
    upper(substring(md5(random()::text) from 1 for 6)) 
  )
  on conflict (id) do nothing;
  return new;
end;
$$;