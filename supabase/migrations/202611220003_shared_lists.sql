begin;

create table public.shared_lists (
    user_id uuid not null
        default auth.uid()
        references auth.users(id) on delete cascade,

    status text not null
        check (status in ('wishlist', 'visited')),

    token uuid not null default gen_random_uuid() unique,

    created_at timestamptz not null default now(),

    primary key (user_id, status)
);

alter table public.shared_lists enable row level security;

revoke all on public.shared_lists
from public, anon, authenticated;

grant select, insert, delete
on public.shared_lists
to authenticated;

create policy shared_lists_own_rows
on public.shared_lists
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

commit;