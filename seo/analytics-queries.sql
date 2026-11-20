-- Requêtes de suivi (à exécuter via l'outil SQL Supabase, projet permizy). Données sans cookie ni identifiant :
-- on compte des événements, pas des personnes.

-- 1. Pages vues par page, 28 derniers jours
select path, count(*) as vues from analytics_events
where event = 'pageview' and at > now() - interval '28 days'
group by path order by vues desc limit 30;

-- 2. Entonnoir de conversion, 28 derniers jours
select event, count(*) from analytics_events
where at > now() - interval '28 days' and event <> 'pageview'
group by event order by array_position(array['guide_cta','verify_start','verify_verdict','verify_prepare','signup','project_created','pay_click','paid'], event);

-- 3. Sites référents (Google, Bing, ChatGPT, réseaux…)
select coalesce(ref, '(direct ou inconnu)') as referent, count(*) from analytics_events
where event = 'pageview' and at > now() - interval '28 days'
group by 1 order by 2 desc limit 20;

-- 4. Guides qui déclenchent des vérifications (clics sur l'appel à l'action)
select label as guide, count(*) from analytics_events
where event = 'guide_cta' and at > now() - interval '28 days'
group by 1 order by 2 desc;

-- 5. Mobile / ordinateur
select device, count(*) from analytics_events where event = 'pageview' and at > now() - interval '28 days' group by 1;
