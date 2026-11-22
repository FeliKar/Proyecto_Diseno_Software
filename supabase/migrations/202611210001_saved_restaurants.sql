begin;

create table if not exists public.saved_restaurants (
    user_id uuid not null
        default auth.uid()
        references auth.users(id) on delete cascade,

    place_id text not null
        check (char_length(place_id) between 1 and 255),

    status text not null
        check (status in ('wishlist', 'visited')),

    created_at timestamptz not null default now(),

    primary key (user_id, place_id)
);

alter table public.saved_restaurants enable row level security;

revoke all on public.saved_restaurants
from public, anon, authenticated;

grant select, insert, update, delete
on public.saved_restaurants
to authenticated;

drop policy if exists saved_restaurants_own_rows
on public.saved_restaurants;

create policy saved_restaurants_own_rows
on public.saved_restaurants
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;