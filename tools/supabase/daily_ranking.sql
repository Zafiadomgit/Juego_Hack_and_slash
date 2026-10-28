-- Fendaria — ranking de la Grieta del Día (proyecto Supabase «Fendaria», ya aplicado como migración daily_ranking)
create table public.daily_scores (
  day date not null,
  player_id uuid not null,
  name text not null check (char_length(name) between 2 and 16),
  hero text not null check (hero in ('iop','cra','feca','sombra','domadora','artificiera','berserker')),
  score integer not null check (score between 0 and 1000000),
  updated_at timestamptz not null default now(),
  primary key (day, player_id)
);
create index daily_scores_day_score on public.daily_scores (day, score desc);
alter table public.daily_scores enable row level security;
revoke all on table public.daily_scores from anon, authenticated;

create or replace function public.submit_daily(p_day date, p_player uuid, p_name text, p_hero text, p_score integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_day < current_date - 1 or p_day > current_date + 1 then raise exception 'día fuera de plazo'; end if;
  p_name := btrim(regexp_replace(p_name, '[<>&"]', '', 'g'));
  insert into daily_scores (day, player_id, name, hero, score)
  values (p_day, p_player, p_name, p_hero, p_score)
  on conflict (day, player_id) do update
    set score = greatest(daily_scores.score, excluded.score),
        name = excluded.name, hero = excluded.hero,
        updated_at = case when excluded.score > daily_scores.score then now() else daily_scores.updated_at end;
end $$;

create or replace function public.get_daily_top(p_day date, p_player uuid)
returns table (pos bigint, name text, hero text, score integer, is_me boolean, total bigint)
language sql stable security definer set search_path = public as $$
  with r as (
    select d.name, d.hero, d.score, d.player_id,
           rank() over (order by d.score desc, d.updated_at asc) as pos,
           count(*) over () as total
    from daily_scores d where d.day = p_day
  )
  select r.pos, r.name, r.hero, r.score, r.player_id = p_player, r.total
  from r where r.pos <= 50 or r.player_id = p_player
  order by r.pos limit 51;
$$;

revoke all on function public.submit_daily(date, uuid, text, text, integer) from public;
revoke all on function public.get_daily_top(date, uuid) from public;
grant execute on function public.submit_daily(date, uuid, text, text, integer) to anon, authenticated;
grant execute on function public.get_daily_top(date, uuid) to anon, authenticated;
