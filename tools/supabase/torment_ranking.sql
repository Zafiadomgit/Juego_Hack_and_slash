-- Fendaria — ranking mundial de Tormento (nivel más alto superado). Aplicado como migración torment_ranking.
create table public.torment_best (
  player_id uuid primary key,
  name text not null check (char_length(name) between 2 and 16),
  hero text not null check (hero in ('iop','cra','feca','sombra','domadora','artificiera','berserker')),
  level integer not null check (level between 1 and 999),
  updated_at timestamptz not null default now()
);
create index torment_best_level on public.torment_best (level desc, updated_at asc);
alter table public.torment_best enable row level security;
revoke all on table public.torment_best from anon, authenticated;

create or replace function public.submit_torment(p_player uuid, p_name text, p_hero text, p_level integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  p_name := btrim(regexp_replace(p_name, '[<>&"]', '', 'g'));
  insert into torment_best (player_id, name, hero, level)
  values (p_player, p_name, p_hero, p_level)
  on conflict (player_id) do update
    set name = excluded.name,
        hero = case when excluded.level > torment_best.level then excluded.hero else torment_best.hero end,
        updated_at = case when excluded.level > torment_best.level then now() else torment_best.updated_at end,
        level = greatest(torment_best.level, excluded.level);
end $$;

create or replace function public.get_torment_top(p_player uuid)
returns table (pos bigint, name text, hero text, level integer, is_me boolean, total bigint)
language sql stable security definer set search_path = public as $$
  with r as (
    select t.name, t.hero, t.level, t.player_id,
           rank() over (order by t.level desc, t.updated_at asc) as pos,
           count(*) over () as total
    from torment_best t
  )
  select r.pos, r.name, r.hero, r.level, r.player_id = p_player, r.total
  from r where r.pos <= 50 or r.player_id = p_player
  order by r.pos limit 51;
$$;

revoke all on function public.submit_torment(uuid, text, text, integer) from public;
revoke all on function public.get_torment_top(uuid) from public;
grant execute on function public.submit_torment(uuid, text, text, integer) to anon, authenticated;
grant execute on function public.get_torment_top(uuid) to anon, authenticated;
