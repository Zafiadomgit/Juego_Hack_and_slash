-- Fendaria: una partida guardada por cuenta (todos los héroes van dentro de data)
create table if not exists public.saves (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

-- cada jugador solo puede ver y escribir su propia fila
create policy "saves_select_own" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves_insert_own" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves_update_own" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
