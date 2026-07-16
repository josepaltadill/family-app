import { describe, expect, it } from 'vitest';
import { ErrorAdaptadorSupabase, errorAdaptadorSupabaseDesde } from './errores-adaptador';

describe('errorAdaptadorSupabaseDesde', () => {
  it('conserva el código Postgres/Supabase del error crudo', () => {
    const error = errorAdaptadorSupabaseDesde('No se pudo guardar', {
      message: 'duplicate key value violates unique constraint',
      code: '23505',
    });

    expect(error).toBeInstanceOf(ErrorAdaptadorSupabase);
    expect(error.codigo).toBe('23505');
    expect(error.message).toBe(
      'No se pudo guardar: duplicate key value violates unique constraint',
    );
  });

  it('funciona sin código (por ejemplo errores de red) dejando `codigo` indefinido', () => {
    const error = errorAdaptadorSupabaseDesde('No se pudo listar', { message: 'fallo de red' });

    expect(error.codigo).toBeUndefined();
    expect(error.message).toBe('No se pudo listar: fallo de red');
  });
});
