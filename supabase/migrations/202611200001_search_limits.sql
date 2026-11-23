begin;

create table if not exists public.restaurant_search_limits (
    user_id uuid primary key references auth.users(id) on delete cascade,
    minute_start timestamptz not null,
    minute_count integer not null,
    day_start date not null,
    day_count integer not null
);

alter table public.restaurant_search_limits enable row level security;

revoke all on public.restaurant_search_limits
from public, anon, authenticated;

-- The counter updates atomically so concurrent requests cannot bypass the limit.
create or replace function public.consume_restaurant_search(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_minute timestamptz := date_trunc('minute', now());
    current_day date := (now() at time zone 'UTC')::date;
begin
    insert into public.restaurant_search_limits as limits
        (user_id, minute_start, minute_count, day_start, day_count)
    values
        (p_user_id, current_minute, 1, current_day, 1)

    on conflict (user_id) do update set
        minute_start = current_minute,
        minute_count = case
            when limits.minute_start = current_minute
                then limits.minute_count + 1
            else 1
        end,
        day_start = current_day,
        day_count = case
            when limits.day_start = current_day
                then limits.day_count + 1
            else 1
        end

    where
        (limits.minute_start <> current_minute or limits.minute_count < 10)
        and
        (limits.day_start <> current_day or limits.day_count < 100);

    return found;
end;
$$;

revoke all on function public.consume_restaurant_search(uuid)
from public, anon, authenticated;

grant execute on function public.consume_restaurant_search(uuid)
to service_role;

commit;