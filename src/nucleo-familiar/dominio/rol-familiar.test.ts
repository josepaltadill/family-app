import { describe, expect, it } from 'vitest';
import { esRolUsuario, rolesUsuario } from './rol-familiar';

describe('RolUsuario', () => {
  it('reconoce admin como rol del dominio', () => {
    expect(esRolUsuario('admin')).toBe(true);
    expect(rolesUsuario).toContain('admin');
  });

  it('reconoce editor como rol del dominio', () => {
    expect(esRolUsuario('editor')).toBe(true);
    expect(rolesUsuario).toContain('editor');
  });

  it('rechaza roles fuera del dominio inicial', () => {
    expect(esRolUsuario('lector')).toBe(false);
  });
});
