begin;

grant select on public.shared_lists to service_role;
grant select on public.saved_restaurants to service_role;

commit;