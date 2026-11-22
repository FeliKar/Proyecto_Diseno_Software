-- Run in SQL Editor with at least two existing test accounts.
-- All changes are rolled back; no Google requests are made.
begin;

do $$
declare
    accounts uuid[];
begin
    select array_agg(id) into accounts
    from (select id from auth.users order by id limit 2) as users;
    if coalesce(array_length(accounts, 1), 0) < 2 then
        raise exception 'Create two test accounts before running this test';
    end if;
    perform set_config('test.user_a', accounts[1]::text, true);
    perform set_config('test.user_b', accounts[2]::text, true);
    perform set_config('test.place', gen_random_uuid()::text, true);
end;
$$;

insert into public.saved_restaurants(user_id, place_id, status)
values (current_setting('test.user_b')::uuid, current_setting('test.place'), 'visited');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);

do $$
declare
    changed integer;
begin
    if exists (select 1 from public.saved_restaurants where place_id = current_setting('test.place')) then
        raise exception 'User A can read user B data';
    end if;

    update public.saved_restaurants set status = 'wishlist'
    where user_id = current_setting('test.user_b')::uuid and place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'User A can update user B data'; end if;

    delete from public.saved_restaurants
    where user_id = current_setting('test.user_b')::uuid and place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'User A can delete user B data'; end if;

    begin
        insert into public.saved_restaurants(user_id, place_id, status)
        values (current_setting('test.user_b')::uuid, current_setting('test.place') || '_forged', 'wishlist');
        raise exception 'User A can insert user B data';
    exception when insufficient_privilege then null;
    end;

    insert into public.saved_restaurants(place_id, status)
    values (current_setting('test.place'), 'wishlist');

    if not exists (select 1 from public.saved_restaurants
        where place_id = current_setting('test.place') and status = 'wishlist') then
        raise exception 'User A cannot read their own entry';
    end if;

    begin
        insert into public.saved_restaurants(place_id, status)
        values (current_setting('test.place'), 'visited');
        raise exception 'Duplicate restaurant was allowed';
    exception when unique_violation then null;
    end;

    begin
        insert into public.saved_restaurants(place_id, status)
        values (current_setting('test.place') || '_invalid', 'invalid');
        raise exception 'Invalid status was allowed';
    exception when check_violation then null;
    end;

    begin
        update public.saved_restaurants set user_id = current_setting('test.user_b')::uuid,
            place_id = current_setting('test.place') || '_moved'
        where place_id = current_setting('test.place');
        raise exception 'Entry ownership could be transferred';
    exception when insufficient_privilege then null;
    end;

    update public.saved_restaurants set status = 'visited'
    where place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'User A cannot move their entry'; end if;

    delete from public.saved_restaurants where place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'User A cannot delete their entry'; end if;
end;
$$;

set local role anon;
do $$
begin
    begin
        perform 1 from public.saved_restaurants limit 1;
        raise exception 'Anonymous access was allowed';
    exception when insufficient_privilege then null;
    end;
end;
$$;

reset role;
do $$
begin
    if not exists (select 1 from public.saved_restaurants
        where user_id = current_setting('test.user_b')::uuid
        and place_id = current_setting('test.place') and status = 'visited') then
        raise exception 'User B entry was changed';
    end if;
    raise notice 'Saved restaurants permission tests passed';
end;
$$;
rollback;
