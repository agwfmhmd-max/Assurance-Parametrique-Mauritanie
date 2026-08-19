-- إصلاح صلاحيات المشرف لجداول المنصة
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor.

-- 1) تسجيل حساب المشرف الحالي كـ admin
insert into public.admin_profiles (user_id, display_name)
select id, coalesce(raw_user_meta_data->>'full_name', email, 'Superviseur')
from auth.users
where id = 'd768510b-58d2-49a9-94e1-f06be503c661'
   or lower(email) = lower('agwfmhmd@gmail.com')
on conflict (user_id) do update
set display_name = excluded.display_name;

-- 2) جعل دالة التحقق من صلاحية المشرف موثوقة
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

-- 3) إعادة إنشاء سياسة team_members
alter table public.team_members enable row level security;
drop policy if exists "écriture admin" on public.team_members;
create policy "écriture admin"
on public.team_members
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 4) ضمان نفس الصلاحية للفرضيات المالية ومحتوى الموقع
alter table public.financial_assumptions enable row level security;
drop policy if exists "écriture admin" on public.financial_assumptions;
create policy "écriture admin"
on public.financial_assumptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.site_settings enable row level security;
drop policy if exists "écriture admin" on public.site_settings;
create policy "écriture admin"
on public.site_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 5) اختبار: يجب أن يعيد هذا true عند تشغيله بحساب المشرف من التطبيق.
select public.is_admin() as is_admin;
