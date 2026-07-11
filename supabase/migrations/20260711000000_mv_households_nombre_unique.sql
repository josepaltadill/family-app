begin;

do $$
declare
  duplicados integer;
begin
  select count(*) into duplicados
  from (
    select lower(btrim(nombre)) as nombre_normalizado
    from public.mv_households
    group by lower(btrim(nombre))
    having count(*) > 1
  ) as mv_households_nombre_duplicados;

  if duplicados > 0 then
    raise exception 'mv_households tiene % nombre(s) duplicado(s) ignorando mayúsculas/espacios; no se puede aplicar el índice único normalizado sin consolidar antes. Ver preflight en supabase/migrations/README.md.', duplicados;
  end if;
end $$;

create unique index mv_households_nombre_key
  on public.mv_households (lower(btrim(nombre)));

commit;
