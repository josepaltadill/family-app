export type DescripcionHarnessPruebas = {
  proyecto: 'family-app';
  runner: 'vitest';
  estado: 'configurado';
};

export function describirHarnessPruebas(): DescripcionHarnessPruebas {
  return {
    proyecto: 'family-app',
    runner: 'vitest',
    estado: 'configurado',
  };
}
