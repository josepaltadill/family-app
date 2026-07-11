import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const rutaMigracion = new URL('../../../../../supabase/migrations/20260711000000_mv_households_nombre_unique.sql', import.meta.url);

describe('migración de unicidad de hogares', () => {
  it('declara una restricción única nominal para mv_households.nombre', async () => {
    const sql = await readFile(rutaMigracion, 'utf8');

    expect(sql).toMatch(/add constraint mv_households_nombre_key unique \(nombre\)/i);
  });
});
