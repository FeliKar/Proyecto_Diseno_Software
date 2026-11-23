-- The tests check usage limits without calling Google.
-- ROLLBACK restores the counters after the tests.
begin;

do $$
declare
    test_user uuid;
    allowed boolean;
begin
    select id into test_user
    from auth.users
    limit 1;

    if test_user is null then
        raise exception 'An existing user is required to run the test';
    end if;

    delete from public.restaurant_search_limits
    where user_id = test_user;

    for attempt in 1..10 loop
        allowed := public.consume_restaurant_search(test_user);

        if not allowed then
            raise exception 'Search % was rejected before reaching the limit', attempt;
        end if;
    end loop;

    if public.consume_restaurant_search(test_user) then
        raise exception 'The eleventh search should be rejected';
    end if;

    update public.restaurant_search_limits
    set minute_start = now() - interval '2 minutes',
        day_count = 100
    where user_id = test_user;

    if public.consume_restaurant_search(test_user) then
        raise exception 'The daily limit is not being enforced';
    end if;

    update public.restaurant_search_limits
    set day_start = (now() at time zone 'UTC')::date - 1
    where user_id = test_user;

    if not public.consume_restaurant_search(test_user) then
        raise exception 'The counters did not reset correctly';
    end if;

    if has_function_privilege(
        'anon',
        'public.consume_restaurant_search(uuid)',
        'EXECUTE'
    ) or has_function_privilege(
        'authenticated',
        'public.consume_restaurant_search(uuid)',
        'EXECUTE'
    ) then
        raise exception 'The function must not be executable by frontend roles';
    end if;

    raise notice 'Usage limit tests passed';
end;
$$;

rollback;