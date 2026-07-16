export const rolesUsuario = ['admin', 'editor'] as const;

export type RolUsuario = (typeof rolesUsuario)[number];

export function esRolUsuario(valor: string): valor is RolUsuario {
  return rolesUsuario.includes(valor as RolUsuario);
}
