-- The tests require two existing accounts; rollback restores their data.
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
end;
$$;

-- The test temporarily frees both list slots; rollback restores existing links.
delete from public.shared_lists
where user_id in (current_setting('test.user_a')::uuid, current_setting('test.user_b')::uuid);
insert into public.shared_lists(user_id, status)
values (current_setting('test.user_b')::uuid, 'wishlist');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);

do $$
declare
    changed integer;
    original_token uuid;
    regenerated_token uuid;
begin
    if exists (select 1 from public.shared_lists
        where user_id = current_setting('test.user_b')::uuid) then
        raise exception 'Another account link is visible';
    end if;

    begin
        insert into public.shared_lists(user_id, status)
        values (current_setting('test.user_b')::uuid, 'visited');
        raise exception 'A link can be created for another account';
    exception when insufficient_privilege then null;
    end;

    insert into public.shared_lists(status) values ('wishlist')
    returning token into original_token;

    insert into public.shared_lists(status) values ('wishlist')
    on conflict (user_id, status) do nothing;

    if not exists (select 1 from public.shared_lists
        where token = original_token and user_id = current_setting('test.user_a')::uuid) then
        raise exception 'Sharing again did not preserve the link';
    end if;

    delete from public.shared_lists where user_id = current_setting('test.user_b')::uuid;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Another account link can be revoked'; end if;

    begin
        insert into public.shared_lists(status) values ('invalid');
        raise exception 'Invalid list status was accepted';
    exception when check_violation then null;
    end;

    delete from public.shared_lists where status = 'wishlist';
    if exists (select 1 from public.shared_lists where token = original_token) then
        raise exception 'Own link could not be revoked';
    end if;

    insert into public.shared_lists(status) values ('wishlist')
    returning token into regenerated_token;
    if regenerated_token = original_token then
        raise exception 'Regenerating a link reused the revoked token';
    end if;
end;
$$;

set local role anon;
do $$
begin
    begin
        perform 1 from public.shared_lists limit 1;
        raise exception 'Anonymous users can enumerate share tokens';
    exception when insufficient_privilege then null;
    end;
end;
$$;

reset role;
do $$
begin
    if not exists (select 1 from public.shared_lists
        where user_id = current_setting('test.user_b')::uuid and status = 'wishlist') then
        raise exception 'Other account sharing was changed';
    end if;
    raise notice 'Shared list permission tests passed';
end;
$$;
rollback;
