-- Mesure d'audience sans cookie ni donnée personnelle : aucun identifiant, aucune IP, aucune adresse.
-- Le navigateur ne peut qu'insérer des événements d'une liste fermée ; seule l'équipe (rôle service / SQL) peut les lire.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  event text not null check (event in ('pageview','verify_start','verify_verdict','verify_prepare','signup','project_created','pay_click','paid','guide_cta')),
  path text not null check (char_length(path) <= 120 and path ~ '^/[a-z0-9/_-]*$'),
  ref text check (ref is null or (char_length(ref) <= 60 and ref ~ '^[a-z0-9.-]+$')),
  source text check (source is null or (char_length(source) <= 40 and source ~ '^[a-z0-9_.-]+$')),
  device text check (device in ('mobile','desktop')),
  label text check (label is null or (char_length(label) <= 40 and label ~ '^[a-z0-9_-]+$'))
);
create index analytics_events_at on public.analytics_events (at);
alter table public.analytics_events enable row level security;
create policy analytics_insert on public.analytics_events for insert to anon, authenticated with check (true);
-- aucune politique de lecture : les visiteurs ne voient rien
