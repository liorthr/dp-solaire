-- Paiements Stripe (un par dossier). Écrits uniquement par la fonction stripe-webhook (rôle service) ;
-- chaque compte ne peut que lire ses propres paiements.
create table public.payments (
  id bigint generated always as identity primary key,
  owner uuid not null references auth.users(id) on delete cascade,
  project_local_id text not null,
  kind text not null,
  amount integer not null,
  currency text not null default 'eur',
  livemode boolean not null default false,
  stripe_session text not null unique,
  created_at timestamptz not null default now()
);
create index payments_owner_project on public.payments (owner, project_local_id);
alter table public.payments enable row level security;
create policy payments_read_own on public.payments for select to authenticated using (owner = (select auth.uid()));
