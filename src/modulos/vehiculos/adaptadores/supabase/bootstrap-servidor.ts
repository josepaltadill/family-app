// Bootstrap SERVIDOR-ONLY del hogar/usuario de desarrollo (diseño §15.6/§15.7).
//
// Por qué no pasa por el cliente Supabase normal (anon key + RLS): la migración
// NO otorga privilegio de insert sobre `mv_households` a `authenticated`
// (solo select/update/delete), y `mv_household_members_insert_admin` exige YA
// ser admin del hogar para insertar la primera membresía. Es decir: RLS impide,
// a propósito, que cualquier usuario autenticado normal se auto-nombre admin de
// un hogar nuevo. El primer admin de un hogar solo puede sembrarse fuera de esa
// frontera (acceso administrativo directo a la base, ejecutado una única vez por
// un operador/proceso de bootstrap, nunca con la `service_role` key de la app en
// ejecución ni desde código cliente). `OperacionesBootstrap` es el puerto que
// representa ese acceso administrativo aislado; su implementación real contra
// Postgres/Supabase queda fuera de este PR por falta de entorno Supabase
// disponible en esta sesión (ver apply-progress.md, sección de blockers).
//
// La función de este módulo solo orquesta el "buscar o crear" de forma
// idempotente: nunca duplica usuario, hogar ni membresía en reejecuciones.
//
// LIMITACIÓN CONOCIDA (single-instance/dev-only): el "buscar o crear" de esta
// función NO tiene respaldo de unicidad a nivel de base de datos (`mv_households.nombre`
// no tiene constraint `unique`; añadirla requeriría una nueva migración, fuera de
// alcance de este PR). Dos invocaciones concurrentes de este bootstrap (por ejemplo,
// dos instancias del servidor arrancando a la vez) podrían intercalarse entre el
// `buscarHogarPorNombre` y el `crearHogar` de cada una y crear dos hogares duplicados
// de forma silenciosa. Para no dejar ese caso pasar desapercibido, tras crear un hogar
// nuevo esta función vuelve a consultar cuántos hogares existen con ese nombre; si
// encuentra más de uno, aborta con `ErrorRaceBootstrapHogar` en vez de continuar como
// si nada. Esto convierte una duplicación silenciosa en un fallo ruidoso y detectable,
// pero NO la previene ni la repara: sigue siendo responsabilidad de un futuro guardián
// de concurrencia (constraint `unique` + migración, o bloqueo/advisory lock) evitar que
// ocurra en primer lugar. Este bootstrap debe tratarse como de un único proceso/instancia
// hasta que exista esa migración; no es seguro para siembra concurrente multi-instancia
// en producción.
import { crearIdentificador, type Identificador } from '../../../../compartido/dominio/identificador';

export class ErrorRaceBootstrapHogar extends Error {
  constructor(nombre: string, cantidadEncontrada: number) {
    super(
      `Condición de carrera detectada al sembrar el hogar de desarrollo "${nombre}": ` +
        `se encontraron ${cantidadEncontrada} hogares con ese nombre justo después de crearlo. ` +
        'Es probable que dos bootstraps concurrentes hayan creado hogares duplicados ' +
        'porque `mv_households.nombre` no tiene una restricción `unique` a nivel de base de datos ' +
        '(requeriría una nueva migración, fuera de alcance de este PR). Abortando para evitar continuar ' +
        'con un estado duplicado silencioso.',
    );
    this.name = 'ErrorRaceBootstrapHogar';
  }
}

export type OperacionesBootstrap = Readonly<{
  buscarUsuarioPorEmail(email: string): Promise<{ id: string } | null>;
  crearUsuario(email: string, password: string): Promise<{ id: string }>;
  buscarHogarPorNombre(nombre: string): Promise<{ id: string } | null>;
  crearHogar(nombre: string): Promise<{ id: string }>;
  /** Re-query usado tras crear un hogar para detectar duplicados por condición de carrera (ver comentario de módulo). */
  contarHogaresPorNombre(nombre: string): Promise<number>;
  buscarMembresia(householdId: string, userId: string): Promise<{ rol: string } | null>;
  crearMembresiaAdmin(householdId: string, userId: string): Promise<void>;
}>;

export type EntradaBootstrap = Readonly<{
  bootstrapEmail: string;
  bootstrapPassword: string;
  bootstrapHouseholdNombre: string;
}>;

export type ContextoBootstrap = Readonly<{
  householdId: Identificador;
  userId: Identificador;
}>;

export async function sembrarHogarDeDesarrollo(
  operaciones: OperacionesBootstrap,
  entrada: EntradaBootstrap,
): Promise<ContextoBootstrap> {
  const usuario =
    (await operaciones.buscarUsuarioPorEmail(entrada.bootstrapEmail)) ??
    (await operaciones.crearUsuario(entrada.bootstrapEmail, entrada.bootstrapPassword));

  const hogarExistente = await operaciones.buscarHogarPorNombre(entrada.bootstrapHouseholdNombre);
  const hogar = hogarExistente ?? (await operaciones.crearHogar(entrada.bootstrapHouseholdNombre));

  if (!hogarExistente) {
    // Solo verificamos tras CREAR (no tras encontrar uno existente): es el único
    // momento en que esta invocación pudo introducir un duplicado por condición de carrera.
    const cantidadConEseNombre = await operaciones.contarHogaresPorNombre(
      entrada.bootstrapHouseholdNombre,
    );

    if (cantidadConEseNombre > 1) {
      throw new ErrorRaceBootstrapHogar(entrada.bootstrapHouseholdNombre, cantidadConEseNombre);
    }
  }

  const membresia = await operaciones.buscarMembresia(hogar.id, usuario.id);

  if (!membresia) {
    await operaciones.crearMembresiaAdmin(hogar.id, usuario.id);
  }

  return {
    householdId: crearIdentificador(hogar.id),
    userId: crearIdentificador(usuario.id),
  };
}
