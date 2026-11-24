-- Options achetées avec ou après le dossier (ex. « RAC » : pack raccordement Enedis + Consuel).
alter table public.payments add column options text[] not null default '{}';
