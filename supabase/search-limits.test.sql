-- Prueba los límites sin consultar Google.
-- ROLLBACK restaura los contadores al terminar.
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
        raise exception 'Debe existir un usuario para ejecutar la prueba';
    end if;

    delete from public.restaurant_search_limits
    where user_id = test_user;

    for attempt in 1..10 loop
        allowed := public.consume_restaurant_search(test_user);

        if not allowed then
            raise exception 'La búsqueda % fue rechazada antes de tiempo', attempt;
        end if;
    end loop;

    if public.consume_restaurant_search(test_user) then
        raise exception 'La búsqueda número 11 debería rechazarse';
    end if;

    update public.restaurant_search_limits
    set minute_start = now() - interval '2 minutes',
        day_count = 100
    where user_id = test_user;

    if public.consume_restaurant_search(test_user) then
        raise exception 'El límite diario no se está aplicando';
    end if;

    update public.restaurant_search_limits
    set day_start = (now() at time zone 'UTC')::date - 1
    where user_id = test_user;

    if not public.consume_restaurant_search(test_user) then
        raise exception 'Los contadores no se reiniciaron correctamente';
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
        raise exception 'La función no debe ser ejecutable desde el frontend';
    end if;

    raise notice 'Pruebas de límites aprobadas';
end;
$$;

rollback;