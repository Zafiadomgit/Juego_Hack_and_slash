-- Fendaria — guardado en la nube. Aplicado como migración cloud_save.
-- Cada partida se identifica por un código secreto que solo conoce el jugador (se guarda su hash, nunca el código).
-- La tabla no se puede leer ni listar: solo se toca con cloud_put (guardar) y cloud_get (recuperar con el código).
create table public.cloud_saves (
  key_hash text primary key,
  data jsonb not null,
  rev bigint not null,
  size integer not null,
  updated_at timestamptz not null default now()
);
alter table public.cloud_saves enable row level security;
revoke all on table public.cloud_saves from anon, authenticated;

-- guarda si la versión que llega es igual o más nueva que la de la nube; si no, devuelve la de la nube (conflicto)
create or replace function public.cloud_put(p_code text, p_data jsonb, p_rev bigint)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare h text; cur bigint; n integer;
begin
  if p_code is null or p_code !~ '^[A-Z0-9-]{20,40}$' then raise exception 'bad code'; end if;
  n := octet_length(p_data::text);
  if n > 1500000 then raise exception 'too big'; end if;
  h := encode(digest(p_code, 'sha256'), 'hex');
  select rev into cur from cloud_saves where key_hash = h for update;
  if cur is not null and cur > p_rev then
    return jsonb_build_object('ok', false, 'rev', cur);
  end if;
  insert into cloud_saves (key_hash, data, rev, size) values (h, p_data, p_rev, n)
  on conflict (key_hash) do update set data = excluded.data, rev = excluded.rev, size = excluded.size, updated_at = now();
  return jsonb_build_object('ok', true, 'rev', p_rev);
end $$;

-- solo la versión (para saber si otro móvil guardó algo más nuevo sin descargar la partida entera)
create or replace function public.cloud_rev(p_code text)
returns bigint language sql stable security definer set search_path = public, extensions as $$
  select rev from cloud_saves where key_hash = encode(digest(p_code, 'sha256'), 'hex');
$$;

create or replace function public.cloud_get(p_code text)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object('data', data, 'rev', rev, 'at', updated_at)
  from cloud_saves where key_hash = encode(digest(p_code, 'sha256'), 'hex');
$$;

revoke all on function public.cloud_put(text, jsonb, bigint) from public;
revoke all on function public.cloud_rev(text) from public;
revoke all on function public.cloud_get(text) from public;
grant execute on function public.cloud_put(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.cloud_rev(text) to anon, authenticated;
grant execute on function public.cloud_get(text) to anon, authenticated;
