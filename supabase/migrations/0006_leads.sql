-- Demandes de mise en relation (ex. maison neuve → architecte partenaire). Insertion seule pour les visiteurs,
-- consentement explicite obligatoire (vérifié par la base), aucune lecture publique.
create table public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('maison_neuve')),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null check (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or (char_length(phone) <= 25 and phone ~ '^[0-9 +().-]+$')),
  postcode text check (postcode is null or postcode ~ '^[0-9]{5}$'),
  city text check (city is null or char_length(city) <= 80),
  surface_m2 int check (surface_m2 is null or surface_m2 between 10 and 2000),
  land text check (land is null or land in ('oui','en_cours','non')),
  timing text check (timing is null or timing in ('moins_6_mois','6_12_mois','plus_12_mois')),
  message text check (message is null or char_length(message) <= 1000),
  consent boolean not null check (consent),
  consent_text text not null check (char_length(consent_text) <= 400),
  status text not null default 'nouveau' check (status in ('nouveau','transmis','clos'))
);
alter table public.leads enable row level security;
create policy leads_insert on public.leads for insert to anon, authenticated with check (consent and status = 'nouveau');
-- événement d'audience « lead »
alter table public.analytics_events drop constraint analytics_events_event_check;
alter table public.analytics_events add constraint analytics_events_event_check check (event in ('pageview','verify_start','verify_verdict','verify_prepare','signup','project_created','pay_click','paid','guide_cta','lead'));
