import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { parseIntoClientConfig } from 'pg-connection-string';
import { describe, expect, it } from 'vitest';

const rutaMigracion = new URL(
  '../../../supabase/migrations/20260713000000_family_app_modularization.sql',
  import.meta.url,
);
const rutasHistoricas = [
  '../../../supabase/validation/auth-fixture.sql',
  '../../../supabase/migrations/20260710000000_supabase_persistence_short.sql',
  '../../../supabase/migrations/20260711000000_mv_households_nombre_unique.sql',
  '../../../supabase/migrations/20260712000000_mv_platform_roles.sql',
  '../../../supabase/validation/fixtures.sql',
].map((ruta) => new URL(ruta, import.meta.url));
const BASE_DEDICADA_AUTORIZADA = 'family_app_modularization_test_review_da7a7c22062311e6';
const HOSTS_LOOPBACK_AUTORIZADOS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const ERROR_DESTINO_NO_AUTORIZADO = 'FAMILY_APP_MIGRATION_TEST_DATABASE_URL debe resolver exactamente al destino loopback dedicado autorizado';
const PUERTO_DEDICADO_AUTORIZADO = 54322;
const URL_PRUEBA_BASE = 'postgresql://test_user:test_password@';
const ESQUEMA_CONTROL = 'family_app_migration_test_control';
const MARCADOR_PROPIEDAD = 'family-app-modularization-test-fixture-v1';
const CLAVE_BLOQUEO = 2_026_071_300_000;
function resolverUrlBaseDedicada(urlExplicita?: string, urlBootstrap?: string) {
  if (urlExplicita) return (resolverDestinoDedicado(urlExplicita), urlExplicita);
  if (!urlBootstrap) return undefined;
  try {
    const admin = parseIntoClientConfig(urlBootstrap);
    if (!HOSTS_LOOPBACK_AUTORIZADOS.has(admin.host ?? '') || Number(admin.port) !== PUERTO_DEDICADO_AUTORIZADO
      || admin.database !== 'postgres') throw new Error();
    const dedicada = new URL(urlBootstrap);
    dedicada.pathname = `/${BASE_DEDICADA_AUTORIZADA}`; dedicada.search = '';
    resolverDestinoDedicado(dedicada.toString());
    return dedicada.toString();
  } catch { throw new Error('SUPABASE_BOOTSTRAP_DATABASE_URL debe resolver al administrador postgres loopback autorizado'); }
}
const urlExplicita = process.env.FAMILY_APP_MIGRATION_TEST_DATABASE_URL;
const urlBootstrap = process.env.SUPABASE_BOOTSTRAP_DATABASE_URL;
const databaseUrl = resolverUrlBaseDedicada(urlExplicita, urlBootstrap);
const ejecutarPostgres = databaseUrl ? describe : describe.skip;
const FIXTURE_PRESERVACION_HISTORICA = `
insert into public.mv_platform_roles (user_id, rol)
values ('00000000-0000-0000-0000-0000000000a1', 'superadmin');
insert into public.mv_eventos_vehiculo (id, household_id, vehiculo_id, tipo, descripcion, kilometros, fecha)
values ('50000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
  '30000000-0000-0000-0000-00000000000a', 'mantenimiento', 'Historical service', 100, '2026-07-01T00:00:00Z');`;

function resolverDestinoDedicado(url: string) {
  try {
    const destino = parseIntoClientConfig(url);
    if (!HOSTS_LOOPBACK_AUTORIZADOS.has(destino.host ?? '')
      || Number(destino.port) !== PUERTO_DEDICADO_AUTORIZADO
      || destino.database !== BASE_DEDICADA_AUTORIZADA) {
      throw new Error(ERROR_DESTINO_NO_AUTORIZADO);
    }
    return destino;
  } catch {
    throw new Error(ERROR_DESTINO_NO_AUTORIZADO);
  }
}

async function leerMigracion() {
  return readFile(rutaMigracion, 'utf8');
}

async function provisionarBaseDedicada(urlAdmin: string) {
  resolverUrlBaseDedicada(undefined, urlAdmin);
  const admin = new Client(parseIntoClientConfig(urlAdmin));
  await admin.connect();
  try {
    await admin.query('select pg_advisory_lock($1)', [CLAVE_BLOQUEO]);
    const existe = await admin.query('select 1 from pg_database where datname = $1', [BASE_DEDICADA_AUTORIZADA]);
    if (existe.rowCount === 0) await admin.query(`create database ${BASE_DEDICADA_AUTORIZADA}`);
  } finally {
    await admin.end();
  }
}

async function reiniciarBaseDedicada(cliente: Client, nombreEsperado: string) {
  const resultado = await cliente.query<{ nombre: string }>('select current_database() as nombre');
  if (resultado.rows[0]?.nombre !== nombreEsperado) {
    throw new Error('La conexión PostgreSQL no coincide con la base dedicada autorizada');
  }

  const estado = await cliente.query<{
    existe_control: boolean;
    existe_marcador: boolean;
    existe_auth: boolean;
    dependencias_public: number;
  }>(`select
    to_regnamespace($1) is not null as existe_control,
    to_regclass($2) is not null as existe_marcador,
    to_regnamespace('auth') is not null as existe_auth,
    (select count(*)::integer from pg_depend
      where refclassid = 'pg_namespace'::regclass
        and refobjid = 'public'::regnamespace and deptype = 'n') as dependencias_public`,
  [ESQUEMA_CONTROL, `${ESQUEMA_CONTROL}.ownership_marker`]);
  const actual = estado.rows[0];
  if (!actual?.existe_control) {
    if (actual?.existe_auth || actual?.dependencias_public !== 0) {
      throw new Error('La base dedicada contiene esquemas sin marcador de propiedad del fixture');
    }
    await cliente.query('begin');
    try {
      await cliente.query(`create schema ${ESQUEMA_CONTROL}; create table ${ESQUEMA_CONTROL}.ownership_marker (marker text primary key)`);
      await cliente.query(`insert into ${ESQUEMA_CONTROL}.ownership_marker (marker) values ($1)`, [MARCADOR_PROPIEDAD]);
      await cliente.query('commit');
    } catch (error) {
      await cliente.query('rollback');
      throw error;
    }
  } else if (!actual.existe_marcador) throw new Error('La base dedicada tiene un marcador de propiedad incompleto');

  const propiedad = await cliente.query<{ marcadores: number }>(`select count(*)::integer as marcadores
    from ${ESQUEMA_CONTROL}.ownership_marker where marker = $1`, [MARCADOR_PROPIEDAD]);
  if (propiedad.rows[0]?.marcadores !== 1) {
    throw new Error('La base dedicada no tiene el marcador de propiedad exacto del fixture');
  }

  await cliente.query('drop schema if exists public cascade; drop schema if exists auth cascade; create schema public; grant usage, create on schema public to postgres;');
}

async function capturarDatos(cliente: Client, finales: boolean) {
  const tablas = finales
    ? ['fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo']
    : ['mv_households', 'mv_household_members', 'mv_platform_roles', 'mv_vehiculos', 'mv_eventos_vehiculo'];
  const ordenes = ['id', 'household_id, user_id', 'user_id', 'id', 'id'];
  const expresiones = tablas.map((tabla, indice) => `(select coalesce(jsonb_agg(to_jsonb(fila) order by ${ordenes[indice]}), '[]'::jsonb) from public.${tabla} fila) as datos_${indice}`);
  const resultado = await cliente.query<Record<string, unknown[]>>(`select ${expresiones.join(',')}`);
  return tablas.map((_tabla, indice) => resultado.rows[0][`datos_${indice}`]);
}

describe('migración atómica family-app modularization', () => {
  it('deriva el destino dedicado desde el bootstrap loopback de CI', () => {
    expect(resolverUrlBaseDedicada(undefined, 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')).toBe(
      'postgresql://postgres:postgres@127.0.0.1:54322/family_app_modularization_test_review_da7a7c22062311e6');
  });

  it.each([
    ['host remoto', 'postgresql://postgres:postgres@10.0.0.5:54322/postgres'],
    ['puerto distinto', 'postgresql://postgres:postgres@127.0.0.1:54323/postgres'],
    ['base administradora distinta', 'postgresql://postgres:postgres@127.0.0.1:54322/template1'],
  ])('rechaza bootstrap inseguro: %s', (_caso, url) => expect(() => resolverUrlBaseDedicada(undefined, url))
    .toThrow('SUPABASE_BOOTSTRAP_DATABASE_URL debe resolver al administrador postgres loopback autorizado'));

  it.each([
    ['IPv4', `${URL_PRUEBA_BASE}127.0.0.1:${PUERTO_DEDICADO_AUTORIZADO}/${BASE_DEDICADA_AUTORIZADA}`],
    ['hostname', `${URL_PRUEBA_BASE}localhost:${PUERTO_DEDICADO_AUTORIZADO}/${BASE_DEDICADA_AUTORIZADA}`],
    ['IPv6', `${URL_PRUEBA_BASE}[::1]:${PUERTO_DEDICADO_AUTORIZADO}/${BASE_DEDICADA_AUTORIZADA}`],
  ])('preserva el destino loopback exacto que resuelve pg: %s', (_caso, url) => {
    expect(resolverDestinoDedicado(url)).toEqual(parseIntoClientConfig(url));
  });

  it.each([
    ['puerto loopback distinto', `${URL_PRUEBA_BASE}127.0.0.1:54323/${BASE_DEDICADA_AUTORIZADA}`],
    ['anulación remota por query host', `${URL_PRUEBA_BASE}127.0.0.1:${PUERTO_DEDICADO_AUTORIZADO}/${BASE_DEDICADA_AUTORIZADA}?host=10.0.0.5`],
    ['host múltiple', `${URL_PRUEBA_BASE}127.0.0.1:${PUERTO_DEDICADO_AUTORIZADO}/${BASE_DEDICADA_AUTORIZADA}?host=127.0.0.1,10.0.0.5`],
    ['socket Unix', `socket:///tmp?db=${BASE_DEDICADA_AUTORIZADA}`],
    ['base dedicada parecida pero no autorizada', `${URL_PRUEBA_BASE}127.0.0.1:${PUERTO_DEDICADO_AUTORIZADO}/family_app_modularization_test_other`],
    ['base postgres', `${URL_PRUEBA_BASE}127.0.0.1:${PUERTO_DEDICADO_AUTORIZADO}/postgres`],
    ['URL malformada', 'postgresql://%zz'],
  ])('rechaza %s antes de conectar o reiniciar', (_caso, url) => {
    expect(() => resolverDestinoDedicado(url)).toThrow('FAMILY_APP_MIGRATION_TEST_DATABASE_URL debe resolver exactamente al destino loopback dedicado autorizado');
  });

  it('declara el corte no destructivo de las cinco tablas y conserva household_id', async () => {
    const sql = await leerMigracion();

    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).toContain('lock table public.mv_households, public.mv_household_members, public.mv_platform_roles, public.mv_vehiculos, public.mv_eventos_vehiculo in access exclusive mode;');
    expect(sql).toContain('alter table public.mv_households rename to fam_hogares;');
    expect(sql).toContain('alter table public.mv_household_members rename to fam_miembros_hogar;');
    expect(sql).toContain('alter table public.mv_platform_roles rename to fam_roles_plataforma;');
    expect(sql).toContain('alter table public.mv_vehiculos rename to fam_ve_vehiculos;');
    expect(sql).toContain('alter table public.mv_eventos_vehiculo rename to fam_ve_eventos_vehiculo;');
    expect(sql).toContain('household_id');
    expect(sql).toContain('p_household_id');
    expect(sql).not.toMatch(/\b(drop|truncate)\b/i);
  });

  it('falla cerrado ante contratos origen/final inesperados y verifica el catálogo final', async () => {
    const sql = await leerMigracion();

    expect(sql).toContain("to_regclass('public.mv_households')");
    expect(sql).toContain("to_regclass('public.fam_hogares')");
    expect(sql).toContain("raise exception 'family-app modularization preflight failed'");
    expect(sql).toContain("raise exception 'family-app modularization postcondition failed'");
    expect(sql).toContain("'fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo'");
    expect(sql).toContain("c.relname ~ '^mv_'");
    expect(sql).not.toContain("like 'mv_%'");
    expect(sql).toMatch(/n\.nspname = 'public' and c\.relkind = 'r' and c\.relrowsecurity/);
  });

  it('limita los renombres de catálogo a las cinco tablas propietarias', async () => {
    const sql = await leerMigracion();

    expect(sql).toContain('join pg_index i on i.indexrelid = c.oid');
    expect(sql.match(/t\.relname in \('fam_hogares'/g)).toHaveLength(4);
  });

  it('renombra dependencias propietarias sin crear aliases de compatibilidad', async () => {
    const sql = await leerMigracion();

    expect(sql).toContain('alter function public.mv_es_miembro(uuid) rename to fam_es_miembro_hogar;');
    expect(sql).toContain('alter function public.mv_tiene_rol(uuid, text[]) rename to fam_tiene_rol_hogar;');
    expect(sql).toContain('alter function public.mv_preservar_admin_hogar() rename to fam_preservar_admin_hogar;');
    expect(sql).toContain('alter policy mv_vehiculos_select_member on public.fam_ve_vehiculos rename to fam_ve_vehiculos_select_member;');
    expect(sql).not.toMatch(/\b(create\s+view|create\s+table\s+public\.mv_)\b/i);
  });
});

ejecutarPostgres('migración modular en PostgreSQL local efímero', () => {
  it('conserva estado, revierte fallos y no toca objetos mv_* ajenos', async () => {
    if (!urlExplicita) await provisionarBaseDedicada(urlBootstrap!);
    const destino = resolverDestinoDedicado(databaseUrl!);
    const cliente = new Client(destino);
    await cliente.connect();
    try {
      await cliente.query('select pg_advisory_lock($1)', [CLAVE_BLOQUEO]);
      await reiniciarBaseDedicada(cliente, BASE_DEDICADA_AUTORIZADA);
      const [historico, migracion] = await Promise.all([
        Promise.all(rutasHistoricas.map((ruta) => readFile(ruta, 'utf8'))).then((sql) => sql.join('\n')),
        leerMigracion(),
      ]);
      await cliente.query(`${historico}\n${FIXTURE_PRESERVACION_HISTORICA}`);
      await cliente.query(`
        create table public.mv_unrelated (id integer primary key);
        create index mv_unrelated_idx on public.mv_unrelated (id);
        alter table public.mv_unrelated enable row level security;
        create policy mv_unrelated_policy on public.mv_unrelated using (true);
        create function public.unrelated_trigger() returns trigger language plpgsql as $$ begin return new; end $$;
        create trigger mv_unrelated_trigger before insert on public.mv_unrelated
          for each row execute function public.unrelated_trigger();
        alter table public.mv_eventos_vehiculo disable row level security;
      `);
      const datosAntes = await capturarDatos(cliente, false);
      expect(datosAntes.map((filas) => filas.length)).toEqual([2, 5, 1, 2, 1]);

      await expect(cliente.query(migracion)).rejects.toThrow(/postcondition failed/);
      await cliente.query('rollback');
      expect(await capturarDatos(cliente, false)).toEqual(datosAntes);
      const rollback = await cliente.query(`select
        (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'mv_households') as source_count,
        (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname = 'fam_hogares') as final_count`);
      expect(rollback.rows[0]).toEqual({ source_count: 1, final_count: 0 });

      await cliente.query('alter table public.mv_eventos_vehiculo enable row level security');
      await cliente.query(migracion);
      const datosDespues = await capturarDatos(cliente, true);
      expect(datosDespues.map((filas) => filas.length)).toEqual([2, 5, 1, 2, 1]);
      expect(datosDespues).toEqual(datosAntes);
      const final = await cliente.query(`select
        (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relkind = 'r'
                and c.relname in ('fam_hogares', 'fam_miembros_hogar', 'fam_roles_plataforma', 'fam_ve_vehiculos', 'fam_ve_eventos_vehiculo'))::integer as final_table_count,
        (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and c.relname = 'mv_unrelated') as unrelated_table_count,
        (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'i' and c.relname = 'mv_unrelated_idx') as unrelated_index_count,
        (select count(*)::integer from pg_policy where polname = 'mv_unrelated_policy') as unrelated_policy_count,
        (select count(*)::integer from pg_trigger where tgname = 'mv_unrelated_trigger' and not tgisinternal) as unrelated_trigger_count`);
      expect(final.rows[0]).toEqual({
        final_table_count: 5,
        unrelated_table_count: 1,
        unrelated_index_count: 1,
        unrelated_policy_count: 1,
        unrelated_trigger_count: 1,
      });
    } finally {
      await cliente.end();
    }
  });
});
