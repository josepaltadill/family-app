-- Atomic schema cut only. Deploy this with PR 3 in one coordinated release window.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Abort rather than guessing when a shared instance is not in the expected state.
do $$
declare
  v_source_count integer;
  v_final_count integer;
begin
  select count(*) into v_source_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in ('mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo');

  select count(*) into v_final_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo');

  if v_source_count <> 5
    or v_final_count <> 0
    or to_regclass('public.mv_households') is null
    or to_regclass('public.fam_hogares') is not null then
    raise exception 'family-app modularization preflight failed';
  end if;
end;
$$;

-- Fixed lock order prevents deadlocks and makes readers/writers wait for all-or-nothing DDL.
lock table public.mv_households, public.mv_household_members, public.mv_platform_roles, public.mv_vehiculos, public.mv_eventos_vehiculo in access exclusive mode;

alter table public.mv_households rename to fam_hogares;
alter table public.mv_household_members rename to fam_miembros_hogar;
alter table public.mv_platform_roles rename to fam_roles_plataforma;
alter table public.mv_vehiculos rename to fam_ve_vehiculos;
alter table public.mv_eventos_vehiculo rename to fam_ve_eventos_vehiculo;

-- Capture each source function's OID-bound owner before replacing its body or renaming it.
create temporary table family_app_function_owners (
  funcion_oid oid primary key,
  propietario_oid oid not null
) on commit drop;
insert into family_app_function_owners (funcion_oid, propietario_oid)
select p.oid, p.proowner
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.oid in (
    to_regprocedure('public.mv_es_miembro(uuid)'),
    to_regprocedure('public.mv_tiene_rol(uuid,text[])'),
    to_regprocedure('public.mv_preservar_admin_hogar()')
  );
do $$
begin
  if (select count(*) from family_app_function_owners) <> 3 then
    raise exception 'family-app modularization function-owner preflight failed';
  end if;
end;
$$;

-- Table renames preserve OIDs, but SQL function bodies retain textual references.
create or replace function public.mv_es_miembro(p_household_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.fam_miembros_hogar where household_id = p_household_id and user_id = auth.uid());
$$;
create or replace function public.mv_tiene_rol(p_household_id uuid, p_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.fam_miembros_hogar where household_id = p_household_id and user_id = auth.uid() and rol = any(p_roles));
$$;
create or replace function public.mv_preservar_admin_hogar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_elimina_admin boolean;
begin
  if tg_op = 'DELETE' then
    v_elimina_admin := old.rol = 'admin';
  else
    v_elimina_admin := old.rol = 'admin' and (new.rol is distinct from 'admin' or new.household_id is distinct from old.household_id);
  end if;
  if not v_elimina_admin then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  perform 1 from public.fam_hogares where id = old.household_id for update;
  if not found then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if not exists (
    select 1 from public.fam_miembros_hogar
    where household_id = old.household_id and rol = 'admin' and user_id <> old.user_id
  ) then
    raise exception using errcode = '23514', message = 'fam_miembros_hogar requires at least one admin per household';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

alter function public.mv_es_miembro(uuid) rename to fam_es_miembro_hogar;
alter function public.mv_tiene_rol(uuid, text[]) rename to fam_tiene_rol_hogar;
alter function public.mv_preservar_admin_hogar() rename to fam_preservar_admin_hogar;

-- Rename every owner-specific dependent object without recreating it or changing its OID.
do $$
declare
  r record;
  v_name text;
begin
  for r in
    select c.conname, t.relname as table_name
    from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo') and c.conname ~ '^mv_'
  loop
    v_name := replace(replace(replace(replace(replace(r.conname, 'mv_households', 'fam_hogares'), 'mv_household_members', 'fam_miembros_hogar'), 'mv_platform_roles', 'fam_roles_plataforma'), 'mv_vehiculos', 'fam_ve_vehiculos'), 'mv_eventos_vehiculo', 'fam_ve_eventos_vehiculo');
    execute format('alter table public.%I rename constraint %I to %I', r.table_name, r.conname, v_name);
  end loop;

  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    join pg_index i on i.indexrelid = c.oid join pg_class t on t.oid = i.indrelid
    where n.nspname = 'public' and c.relkind = 'i' and c.relname ~ '^mv_'
      and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo')
  loop
    v_name := replace(replace(replace(replace(replace(r.relname, 'mv_households', 'fam_hogares'), 'mv_household_members', 'fam_miembros_hogar'), 'mv_platform_roles', 'fam_roles_plataforma'), 'mv_vehiculos', 'fam_ve_vehiculos'), 'mv_eventos_vehiculo', 'fam_ve_eventos_vehiculo');
    execute format('alter index public.%I rename to %I', r.relname, v_name);
  end loop;

  for r in
    select p.polname, t.relname as table_name from pg_policy p join pg_class t on t.oid = p.polrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and p.polname ~ '^mv_' and p.polname <> 'mv_vehiculos_select_member'
      and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo')
  loop
    v_name := replace(replace(replace(replace(replace(r.polname, 'mv_households', 'fam_hogares'), 'mv_household_members', 'fam_miembros_hogar'), 'mv_platform_roles', 'fam_roles_plataforma'), 'mv_vehiculos', 'fam_ve_vehiculos'), 'mv_eventos_vehiculo', 'fam_ve_eventos_vehiculo');
    execute format('alter policy %I on public.%I rename to %I', r.polname, r.table_name, v_name);
  end loop;

  for r in
    select tg.tgname, t.relname as table_name from pg_trigger tg join pg_class t on t.oid = tg.tgrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and not tg.tgisinternal and tg.tgname ~ '^mv_'
      and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo')
  loop
    v_name := replace(replace(replace(replace(replace(r.tgname, 'mv_households', 'fam_hogares'), 'mv_household_members', 'fam_miembros_hogar'), 'mv_platform_roles', 'fam_roles_plataforma'), 'mv_vehiculos', 'fam_ve_vehiculos'), 'mv_eventos_vehiculo', 'fam_ve_eventos_vehiculo');
    execute format('alter trigger %I on public.%I rename to %I', r.tgname, r.table_name, v_name);
  end loop;
end;
$$;

-- Explicit representative policy rename keeps the security contract obvious in review.
alter policy mv_vehiculos_select_member on public.fam_ve_vehiculos rename to fam_ve_vehiculos_select_member;

-- Verify final tables, RLS, and that no owner-specific mv_* catalog objects remain.
do $$
declare
  v_final_count integer;
  v_rls_count integer;
  v_mv_count integer;
  v_protected_function_count integer;
  v_exact_function_contract_count integer;
  v_preserved_function_owner_count integer;
  v_anon_revocation_count integer;
  v_authenticated_grant_count integer;
begin
  select count(*) into v_final_count from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and c.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo');
  select count(*) into v_rls_count from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    and c.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo');
  select count(*) into v_mv_count from (
    select c.oid from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname ~ '^mv_(households|household_members|platform_roles|vehiculos|eventos_vehiculo)(_|$)'
    union all
    select c.oid from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo') and c.conname ~ '^mv_'
    union all
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('mv_es_miembro', 'mv_tiene_rol', 'mv_preservar_admin_hogar')
    union all
    select tg.oid from pg_trigger tg join pg_class t on t.oid = tg.tgrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and not tg.tgisinternal and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo') and tg.tgname ~ '^mv_'
    union all
    select p.oid from pg_policy p join pg_class t on t.oid = p.polrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo') and p.polname ~ '^mv_'
  ) productive_mv_object;
  select count(*) into v_protected_function_count
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('fam_es_miembro_hogar', 'fam_tiene_rol_hogar', 'fam_preservar_admin_hogar');
  select count(*) into v_exact_function_contract_count
  from (values
    ('public.fam_es_miembro_hogar(uuid)', 'uuid', true),
    ('public.fam_tiene_rol_hogar(uuid,text[])', 'uuid, text[]', true),
    ('public.fam_preservar_admin_hogar()', '', false)
  ) as g(identidad, argumentos, puede_ejecutar_authenticated)
  join pg_proc p on p.oid = to_regprocedure(g.identidad)
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and oidvectortypes(p.proargtypes) = g.argumentos
    and p.prosecdef and p.proowner <> 0
    and exists (select 1 from unnest(coalesce(p.proconfig, array[]::text[])) configuracion where configuracion = 'search_path=""')
    and not has_function_privilege('public', p.oid, 'execute')
    and has_function_privilege('authenticated', p.oid, 'execute') = g.puede_ejecutar_authenticated;
  select count(*) into v_preserved_function_owner_count
  from (values
    ('public.fam_es_miembro_hogar(uuid)'),
    ('public.fam_tiene_rol_hogar(uuid,text[])'),
    ('public.fam_preservar_admin_hogar()')
  ) as g(identidad)
  join pg_proc p on p.oid = to_regprocedure(g.identidad)
  join family_app_function_owners o on o.funcion_oid = p.oid and o.propietario_oid = p.proowner;
  select count(*) into v_anon_revocation_count
  from pg_class t join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relkind = 'r'
    and t.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'select')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'insert')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'update')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'delete')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'truncate')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'references')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'trigger')
    and not has_table_privilege('anon', format('public.%I', t.relname), 'maintain');
  select count(*) into v_authenticated_grant_count
  from (values
    ('fam_hogares', true, false, true, true, false, false, false, false),
    ('fam_miembros_hogar', true, true, true, true, false, false, false, false),
    ('fam_roles_plataforma', false, false, false, false, false, false, false, false),
    ('fam_ve_vehiculos', true, true, true, true, false, false, false, false),
    ('fam_ve_eventos_vehiculo', true, true, true, true, false, false, false, false)
  ) as g(nombre, puede_select, puede_insert, puede_update, puede_delete, puede_truncate, puede_references, puede_trigger, puede_maintain)
  join pg_class t on t.relname = g.nombre
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public' and t.relkind = 'r'
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'select') = g.puede_select
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'insert') = g.puede_insert
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'update') = g.puede_update
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'delete') = g.puede_delete
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'truncate') = g.puede_truncate
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'references') = g.puede_references
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'trigger') = g.puede_trigger
    and has_table_privilege('authenticated', format('public.%I', t.relname), 'maintain') = g.puede_maintain;
  if v_final_count <> 5 or v_rls_count <> 5 or v_mv_count <> 0 then
    raise exception 'family-app modularization postcondition failed';
  end if;
  if v_protected_function_count <> 3 or v_exact_function_contract_count <> 3
    or v_preserved_function_owner_count <> 3
    or v_anon_revocation_count <> 5 or v_authenticated_grant_count <> 5 then
    raise exception 'family-app modularization security postcondition failed';
  end if;
end;
$$;

commit;
