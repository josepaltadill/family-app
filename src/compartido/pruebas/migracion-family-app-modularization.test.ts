import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';

const rutaMigracion = new URL(
  '../../../supabase/migrations/20260713000000_family_app_modularization.sql',
  import.meta.url,
);
const rutasHistoricas = [
  '../../../supabase/migrations/20260710000000_supabase_persistence_short.sql',
  '../../../supabase/migrations/20260711000000_mv_households_nombre_unique.sql',
  '../../../supabase/migrations/20260712000000_mv_platform_roles.sql',
  '../../../supabase/validation/fixtures.sql',
].map((ruta) => new URL(ruta, import.meta.url));
const databaseUrl = process.env.FAMILY_APP_MIGRATION_TEST_DATABASE_URL;
const ejecutarPostgres = databaseUrl ? describe : describe.skip;

async function leerMigracion() {
  return readFile(rutaMigracion, 'utf8');
}

describe('migración atómica family-app modularization', () => {
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
    const destino = new URL(databaseUrl!);
    if (!['127.0.0.1', 'localhost', '::1'].includes(destino.hostname)
      || !destino.pathname.startsWith('/family_app_modularization_test_')) {
      throw new Error('FAMILY_APP_MIGRATION_TEST_DATABASE_URL debe apuntar a una base local efímera dedicada');
    }

    const cliente = new Client({ connectionString: databaseUrl });
    await cliente.connect();
    try {
      const [historico, migracion] = await Promise.all([
        Promise.all(rutasHistoricas.map((ruta) => readFile(ruta, 'utf8'))).then((sql) => sql.join('\n')),
        leerMigracion(),
      ]);
      await cliente.query(historico);
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

      await expect(cliente.query(migracion)).rejects.toThrow(/postcondition failed/);
      await cliente.query('rollback');
      const rollback = await cliente.query(`select
        to_regclass('public.mv_households') is not null as source_ok,
        to_regclass('public.fam_hogares') is null as final_absent,
        (select count(*) from public.mv_vehiculos v join public.mv_households h on h.id = v.household_id
          where h.id in ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000b')) = 2 as rows_ok`);
      expect(rollback.rows[0]).toEqual({ source_ok: true, final_absent: true, rows_ok: true });

      await cliente.query('alter table public.mv_eventos_vehiculo enable row level security');
      await cliente.query(migracion);
      const final = await cliente.query(`select
        to_regclass('public.fam_hogares') is not null as final_ok,
        (select count(*) from public.fam_ve_vehiculos v join public.fam_hogares h on h.id = v.household_id
          where h.id in ('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000b')) = 2 as rows_ok,
        to_regclass('public.mv_unrelated') is not null as table_ok,
        to_regclass('public.mv_unrelated_idx') is not null as index_ok,
        exists(select from pg_policy where polname = 'mv_unrelated_policy') as policy_ok,
        exists(select from pg_trigger where tgname = 'mv_unrelated_trigger') as trigger_ok`);
      expect(final.rows[0]).toEqual({
        final_ok: true, rows_ok: true, table_ok: true, index_ok: true, policy_ok: true, trigger_ok: true,
      });
    } finally {
      await cliente.end();
    }
  });
});
