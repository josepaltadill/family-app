import { describe, expect, it } from 'vitest';

import { describirHarnessPruebas } from './harness';

describe('harness de pruebas', () => {
  it('describe el runner configurado para el proyecto', () => {
    expect(describirHarnessPruebas()).toEqual({
      proyecto: 'family-app',
      runner: 'vitest',
      estado: 'configurado',
    });
  });
});
