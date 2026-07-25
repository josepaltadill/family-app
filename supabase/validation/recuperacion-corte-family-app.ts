export type EstadoCorteFamiliar = Readonly<{
  migracionConfirmada: boolean;
  escriturasFamAceptadas: number;
}>;

export type EstadoRecuperableFamiliar = Readonly<{
  migracionConfirmada: boolean;
  consumidoresObservados: readonly string[];
  filas: ReadonlyArray<Readonly<{
    tabla: string;
    id: string;
    householdId: string;
    relacionadoCon?: string;
  }>>;
  seguridad: Readonly<{
    propietario: string;
    grants: readonly string[];
    politicasRls: readonly string[];
    rlsHabilitado: boolean;
  }>;
}>;

export type DecisionRecuperacionCorteFamiliar = Readonly<{
  estrategia: 'rollback-controlado' | 'fix-forward';
  puntoDeNoRetornoAlcanzado: boolean;
  acceso: 'cerrado';
  operacionesProhibidas: readonly ['borrar-datos', 'reasignar-datos'];
  requiereVerificacionRls: true;
}>;

export type ResultadoRecuperacionCorteFamiliar = Readonly<{
  estrategia: DecisionRecuperacionCorteFamiliar['estrategia'];
  acceso: 'cerrado' | 'abierto';
  estadoPosterior: EstadoRecuperableFamiliar;
}>;

export type AccionesRecuperacionFamiliar = Readonly<Record<DecisionRecuperacionCorteFamiliar['estrategia'], (estado: EstadoRecuperableFamiliar) => EstadoRecuperableFamiliar>>;

/**
 * El punto de no retorno es la primera escritura fam_* aceptada tras el commit.
 * La recuperación nunca borra o reasigna datos automáticamente.
 */
export function decidirRecuperacionCorteFamiliar(
  estado: EstadoCorteFamiliar,
): DecisionRecuperacionCorteFamiliar {
  const puntoDeNoRetornoAlcanzado = estado.migracionConfirmada && estado.escriturasFamAceptadas > 0;

  return {
    estrategia: puntoDeNoRetornoAlcanzado ? 'fix-forward' : 'rollback-controlado',
    puntoDeNoRetornoAlcanzado,
    acceso: 'cerrado',
    operacionesProhibidas: ['borrar-datos', 'reasignar-datos'],
    requiereVerificacionRls: true,
  };
}

function copiarEstado(estado: EstadoRecuperableFamiliar): EstadoRecuperableFamiliar {
  return {
    migracionConfirmada: estado.migracionConfirmada,
    consumidoresObservados: [...estado.consumidoresObservados],
    filas: estado.filas.map((fila) => ({ ...fila })),
    seguridad: {
      propietario: estado.seguridad.propietario,
      grants: [...estado.seguridad.grants],
      politicasRls: [...estado.seguridad.politicasRls],
      rlsHabilitado: estado.seguridad.rlsHabilitado,
    },
  };
}

/** Ejecuta la recuperación seleccionada y reabre solo por evidencia posterior. */
export function aplicarRecuperacionCorteFamiliar(
  estado: EstadoRecuperableFamiliar,
  corte: EstadoCorteFamiliar,
  consumidoresRequeridos: readonly string[],
  acciones: AccionesRecuperacionFamiliar,
): ResultadoRecuperacionCorteFamiliar {
  const decision = decidirRecuperacionCorteFamiliar(corte);
  let posterior: EstadoRecuperableFamiliar;
  let accionEjecutada = false;
  try {
    posterior = copiarEstado(acciones[decision.estrategia](copiarEstado(estado)));
    accionEjecutada = true;
  } catch {
    posterior = copiarEstado(estado);
  }
  const iguales = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const seguro = accionEjecutada
    && posterior.migracionConfirmada
    && posterior.seguridad.rlsHabilitado
    && iguales(posterior.filas, estado.filas)
    && posterior.seguridad.propietario === estado.seguridad.propietario
    && iguales(posterior.seguridad.grants, estado.seguridad.grants)
    && iguales(posterior.seguridad.politicasRls, estado.seguridad.politicasRls)
    && consumidoresRequeridos.every((consumidor) => posterior.consumidoresObservados.includes(consumidor));

  return { estrategia: decision.estrategia, acceso: seguro ? 'abierto' : 'cerrado', estadoPosterior: posterior };
}
