-- The tests require two existing accounts and roll back all test changes.
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
    perform set_config('test.row_a', gen_random_uuid()::text, true);
    perform set_config('test.row_b', gen_random_uuid()::text, true);
end;
$$;

insert into public.search_history(id, user_id, category, price_level)
values (current_setting('test.row_b')::uuid, current_setting('test.user_b')::uuid,
    'seafood', 'moderate');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);

do $$
declare
    changed integer;
begin
    if exists (select 1 from public.search_history
        where user_id = current_setting('test.user_b')::uuid) then
        raise exception 'User A can read user B history';
    end if;

    begin
        insert into public.search_history(user_id, category)
        values (current_setting('test.user_b')::uuid, 'italian');
        raise exception 'User A can insert history for user B';
    exception when insufficient_privilege then null;
    end;

    insert into public.search_history(id, category, price_level)
    values (current_setting('test.row_a')::uuid, 'italian', 'inexpensive');

    if not exists (select 1 from public.search_history
        where id = current_setting('test.row_a')::uuid
        and user_id = current_setting('test.user_a')::uuid) then
        raise exception 'Own history cannot be read or has incorrect owner';
    end if;

    begin
        insert into public.search_history(category) values ('invalid');
        raise exception 'Invalid category was accepted';
    exception when check_violation then null;
    end;

    begin
        insert into public.search_history(price_level) values ('invalid');
        raise exception 'Invalid budget was accepted';
    exception when check_violation then null;
    end;

    -- A clear-all request must only remove the current user's rows.
    delete from public.search_history;
    if exists (select 1 from public.search_history) then
        raise exception 'Own history was not cleared';
    end if;

    delete from public.search_history where id = current_setting('test.row_b')::uuid;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'User A can delete user B history'; end if;
end;
$$;

set local role anon;
do $$
begin
    begin
        perform 1 from public.search_history limit 1;
        raise exception 'Anonymous access was allowed';
    exception when insufficient_privilege then null;
    end;
end;
$$;

reset role;
do $$
begin
    if not exists (select 1 from public.search_history
        where id = current_setting('test.row_b')::uuid and category = 'seafood') then
        raise exception 'User B history was deleted';
    end if;
    raise notice 'Search history permission tests passed';
end;
$$;
rollback;
