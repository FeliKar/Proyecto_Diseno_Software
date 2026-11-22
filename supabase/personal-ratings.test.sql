-- Requires two existing accounts. All test changes are rolled back.
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

insert into public.saved_restaurants(user_id, place_id, status, user_rating,
    user_category, user_price_level)
values
    (current_setting('test.user_a')::uuid, current_setting('test.place'),
        'visited', null, '', ''),
    (current_setting('test.user_b')::uuid, current_setting('test.place'),
        'visited', 2, 'seafood', 'moderate');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.user_a'), true);

do $$
declare
    changed integer;
begin
    if exists (select 1 from public.saved_restaurants
        where user_id = current_setting('test.user_b')::uuid
        and place_id = current_setting('test.place')) then
        raise exception 'Another account rating is visible';
    end if;

    update public.saved_restaurants set user_rating = 5,
        user_category = 'italian', user_price_level = 'inexpensive'
    where user_id = current_setting('test.user_a')::uuid
        and place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'Own rating could not be saved'; end if;

    if not exists (select 1 from public.saved_restaurants
        where place_id = current_setting('test.place')
        and user_rating = 5 and user_category = 'italian'
        and user_price_level = 'inexpensive') then
        raise exception 'Own rating values were not saved';
    end if;

    update public.saved_restaurants set user_rating = 5
    where user_id = current_setting('test.user_b')::uuid
        and place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Another account rating could be changed'; end if;

    begin
        update public.saved_restaurants set user_rating = 6
        where place_id = current_setting('test.place');
        raise exception 'Invalid rating was accepted';
    exception when check_violation then null;
    end;

    begin
        update public.saved_restaurants set user_category = 'invalid'
        where place_id = current_setting('test.place');
        raise exception 'Invalid category was accepted';
    exception when check_violation then null;
    end;

    begin
        update public.saved_restaurants set user_price_level = 'invalid'
        where place_id = current_setting('test.place');
        raise exception 'Invalid budget was accepted';
    exception when check_violation then null;
    end;

    update public.saved_restaurants set user_rating = null,
        user_category = '', user_price_level = ''
    where place_id = current_setting('test.place');
    get diagnostics changed = row_count;
    if changed <> 1 then raise exception 'Own rating could not be cleared'; end if;
end;
$$;

reset role;
do $$
begin
    if not exists (select 1 from public.saved_restaurants
        where user_id = current_setting('test.user_b')::uuid
        and place_id = current_setting('test.place') and user_rating = 2) then
        raise exception 'Other account rating was changed';
    end if;
    raise notice 'Personal rating permission tests passed';
end;
$$;
rollback;
