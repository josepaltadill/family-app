begin;

alter table public.mv_households
  add constraint mv_households_nombre_key unique (nombre);

commit;
