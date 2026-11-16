-- Permizy V1 : stockage « document » des données de l'application, une ligne par dossier / client / compte.
-- Chaque utilisateur ne voit et ne modifie que ses propres lignes (RLS). Les photos vont dans un bucket privé,
-- rangées dans un dossier au nom de l'utilisateur.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  company text not null default '',
  kind text not null default 'particulier' check (kind in ('particulier', 'professionnel')),
  tenant jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, local_id)
);

create table public.projects (
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_id text not null,
  reference text not null default '',
  works text not null default 'pv',
  status text not null default 'brouillon',
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, local_id)
);
create index projects_owner_updated on public.projects (owner, updated_at desc);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;

create policy profiles_own on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy clients_own on public.clients for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy projects_own on public.projects for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

-- profil créé automatiquement à l'inscription (nom, entreprise, type de compte transmis dans les métadonnées)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, company, kind)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'company', ''),
    case when new.raw_user_meta_data ->> 'kind' = 'professionnel' then 'professionnel' else 'particulier' end
  );
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- photos : bucket privé, 15 Mo max, images uniquement ; chemin = <id utilisateur>/<clé>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

create policy photos_own_select on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy photos_own_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy photos_own_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy photos_own_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
