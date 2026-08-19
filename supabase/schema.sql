-- ============================================================
-- SCHÉMA SUPABASE — Plateforme APC Mauritanie (étude ISCAE)
-- Exécuter dans l'éditeur SQL du projet Supabase.
-- Lecture publique pour les visiteurs ; écriture réservée aux
-- administrateurs authentifiés (RLS).
-- ============================================================

-- 1. Profils administrateurs (liés à auth.users)
create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.admin_profiles enable row level security;
create policy "admin: lire son profil" on public.admin_profiles
  for select to authenticated using (auth.uid() = user_id);

-- Fonction utilitaire : l'utilisateur courant est-il admin ?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

-- 2. Paramètres généraux du site (CMS)
create table if not exists public.site_settings (
  id int primary key default 1,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);
alter table public.site_settings enable row level security;
create policy "lecture publique" on public.site_settings for select to anon, authenticated using (true);
create policy "écriture admin" on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3. Hypothèses financières
create table if not exists public.financial_assumptions (
  id int primary key default 1,
  assumptions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint singleton_fa check (id = 1)
);
alter table public.financial_assumptions enable row level security;
create policy "lecture publique" on public.financial_assumptions for select to anon, authenticated using (true);
create policy "écriture admin" on public.financial_assumptions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4. Membres de l'équipe
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  function text default '',
  specialty text default '',
  bio text default '',
  linkedin text default '',
  role text default '',
  photo_url text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.team_members enable row level security;
create policy "lecture publique" on public.team_members for select to anon, authenticated using (true);
create policy "écriture admin" on public.team_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 5. Scénarios financiers (optionnel — multiplicateurs personnalisés)
create table if not exists public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  multipliers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.financial_scenarios enable row level security;
create policy "lecture publique" on public.financial_scenarios for select to anon, authenticated using (true);
create policy "écriture admin" on public.financial_scenarios for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 6. Paramètres techniques (seuils, indices)
create table if not exists public.technical_parameters (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.technical_parameters enable row level security;
create policy "lecture publique" on public.technical_parameters for select to anon, authenticated using (true);
create policy "écriture admin" on public.technical_parameters for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 7. Sections de l'étude (contenu éditorial)
create table if not exists public.study_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.study_sections enable row level security;
create policy "lecture publique" on public.study_sections for select to anon, authenticated using (true);
create policy "écriture admin" on public.study_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 8. Bucket Storage pour les photos de l'équipe
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

create policy "photos: lecture publique" on storage.objects
  for select to anon, authenticated using (bucket_id = 'team-photos');
create policy "photos: écriture admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'team-photos' and public.is_admin());
create policy "photos: mise à jour admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());
create policy "photos: suppression admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());

-- ============================================================
-- APRÈS EXÉCUTION :
-- 1. Créer l'utilisateur superviseur dans Authentication > Users.
-- 2. L'enregistrer comme admin :
--      insert into public.admin_profiles (user_id, display_name)
--      values ('<uuid-utilisateur>', 'Superviseur');
-- 3. Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
--    (uniquement la clé anon publique — jamais la clé service_role).
-- ============================================================
