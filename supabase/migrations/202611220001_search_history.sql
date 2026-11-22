begin;

create table public.search_history (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        default auth.uid()
        references auth.users(id) on delete cascade,

    category text not null default ''
        check (category in ('', 'vegetarian', 'italian', 'seafood')),

    price_level text not null default ''
        check (price_level in ('', 'inexpensive', 'moderate', 'expensive')),

    created_at timestamptz not null default now()
);

create index search_history_user_date_idx
on public.search_history (user_id, created_at desc);

alter table public.search_history enable row level security;

revoke all on public.search_history
from public, anon, authenticated;

grant select, insert, delete
on public.search_history
to authenticated;

create policy search_history_own_rows
on public.search_history
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;