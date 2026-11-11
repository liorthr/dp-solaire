-- DP Solaire : schéma initial (Supabase / Postgres 15+ avec PostGIS)
-- Toutes les tables métier portent tenant_id et sont sous RLS stricte.
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tenancy
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  siret text,
  logo_path text,
  legal_mentions text,
  retention_months int not null default 60,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create type member_role as enum ('admin', 'user');
create table memberships (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null default 'user',
  primary key (tenant_id, user_id)
);

create or replace function is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from memberships m where m.tenant_id = t and m.user_id = auth.uid());
$$;
create or replace function is_tenant_admin(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from memberships m where m.tenant_id = t and m.user_id = auth.uid() and m.role = 'admin');
$$;
create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from users where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------- métier
create table clients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  civility text, first_name text, last_name text not null,
  email text, phone text, address text,
  created_at timestamptz not null default now()
);

create type project_status as enum ('brouillon','pret','depose','recepisse','instruction','pieces_demandees','accord','refus','retire');
create type filing_mode as enum ('teleservice','email','lrar','main_propre');
create table projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  reference text not null,
  address_label text not null,
  insee text, postcode text, city text,
  location geography(point, 4326),
  status project_status not null default 'brouillon',
  filing_mode filing_mode,
  kind text not null default 'toiture', -- toiture | ombriere | sol (V1.5)
  pv jsonb not null default '{}',      -- puissance, panneaux, pose, onduleur
  enrichment jsonb not null default '{}',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on projects (tenant_id, status);

create table parcels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  idu text not null, section text, numero text, contenance_m2 numeric,
  geom geometry(multipolygon, 4326)
);
create table buildings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  source text, source_id text, height_m numeric, geom geometry(multipolygon, 4326)
);
create table roof_planes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  label text, azimuth_deg numeric, tilt_deg numeric, width_m numeric, slope_length_m numeric,
  geom geometry(polygon, 4326)
);
create table pv_layouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  roof_plane_id uuid references roof_planes(id) on delete cascade,
  params jsonb not null, panels jsonb not null, version int not null default 1
);
create table equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade, -- null = catalogue global
  kind text not null check (kind in ('panel','inverter')),
  brand text not null, model text not null, specs jsonb not null default '{}'
);

create type document_status as enum ('a_generer','genere','valide','obsolete');
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  code text not null, -- DP1..DP8, CERFA, BORDEREAU, NOTICE, MANDAT, ...
  version int not null default 1,
  storage_path text, sha256 text,
  status document_status not null default 'a_generer',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- référentiels (lecture pour tous, écriture super-admin)
create type rule_severity as enum ('ok','alerte','bloquant','info');
create table regulation_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null, version int not null,
  category text not null, title text not null,
  condition jsonb not null, severity rule_severity not null,
  message text not null, suggestion text,
  source_url text not null, source_label text,
  verification text not null check (verification in ('VERIFIE','A_VERIFIER')),
  valid_from date not null, valid_to date,
  unique (code, version)
);
create table cerfa_versions (
  id uuid primary key default gen_random_uuid(),
  cerfa text not null, version text not null,
  pdf_path text not null, mapping jsonb not null,
  valid_from date not null, valid_to date, source_url text not null,
  unique (cerfa, version)
);
create table commune_profiles (
  insee text primary key,
  name text, mairie jsonb, email text, teleservice_url text, accepts_email boolean,
  specifics jsonb default '{}', source text, updated_at timestamptz default now()
);
create table provider_cache (
  key text primary key, provider text not null, payload jsonb not null,
  fetched_at timestamptz not null default now(), expires_at timestamptz not null
);

-- ---------------------------------------------------------------- suivi
create table rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  ruleset_version text not null, results jsonb not null, score int,
  evaluated_at timestamptz not null default now()
);
create table instruction_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  type text not null, occurred_on date not null, payload jsonb default '{}',
  created_at timestamptz not null default now()
);
create table mail_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  channel filing_mode not null, recipient text, subject text, body text,
  attachments jsonb default '[]', confirmed_by uuid references users(id), sent_at timestamptz
);
create table audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid, action text not null, entity text, entity_id text,
  meta jsonb default '{}', at timestamptz not null default now()
);
create table subscriptions (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  plan text not null default 'decouverte', stripe_customer_id text, stripe_subscription_id text,
  status text not null default 'trialing', current_period_end timestamptz
);

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array['clients','projects','parcels','buildings','roof_planes','pv_layouts','documents',
                           'rule_evaluations','instruction_events','mail_drafts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all using (is_member(tenant_id)) with check (is_member(tenant_id))', t || '_tenant', t);
  end loop;
end $$;

alter table tenants enable row level security;
create policy tenants_read on tenants for select using (is_member(id) or is_super_admin());
create policy tenants_admin on tenants for update using (is_tenant_admin(id)) with check (is_tenant_admin(id));

alter table users enable row level security;
create policy users_self on users for select using (id = auth.uid() or is_super_admin());

alter table memberships enable row level security;
create policy memberships_read on memberships for select using (is_member(tenant_id));
create policy memberships_admin on memberships for all using (is_tenant_admin(tenant_id)) with check (is_tenant_admin(tenant_id));

alter table equipment_catalog enable row level security;
create policy catalog_read on equipment_catalog for select using (tenant_id is null or is_member(tenant_id));
create policy catalog_write on equipment_catalog for all using (is_member(tenant_id)) with check (is_member(tenant_id));

alter table audit_log enable row level security;
create policy audit_read on audit_log for select using (is_tenant_admin(tenant_id) or is_super_admin());
create policy audit_insert on audit_log for insert with check (is_member(tenant_id));

alter table subscriptions enable row level security;
create policy subs_read on subscriptions for select using (is_member(tenant_id));

do $$
declare t text;
begin
  foreach t in array array['regulation_rules','cerfa_versions','commune_profiles'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (auth.role() = ''authenticated'')', t || '_read', t);
    execute format('create policy %I on %I for all using (is_super_admin()) with check (is_super_admin())', t || '_admin', t);
  end loop;
end $$;
alter table provider_cache enable row level security; -- accès service_role uniquement

-- Stockage : bucket privé « dossiers », chemins préfixés par tenant_id/
insert into storage.buckets (id, name, public) values ('dossiers', 'dossiers', false) on conflict do nothing;
create policy dossiers_tenant on storage.objects for all
  using (bucket_id = 'dossiers' and is_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'dossiers' and is_member(((storage.foldername(name))[1])::uuid));
