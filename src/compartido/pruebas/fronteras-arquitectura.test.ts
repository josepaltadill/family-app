import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const RAIZ_SRC = fileURLToPath(new URL('../..', import.meta.url));
const EXTENSIONES = new Set(['.ts', '.tsx']);
const ADAPTADOR_SUPABASE = /(?:^|\/)(?:adaptadores|infraestructura)\/supabase(?:\/|$)/;
const IDENTIDAD = /(?:^|\/)(?:proveedor-identidad(?:-supabase-servidor)?|resolver-acceso-familiar|cliente-supabase-servidor)(?:\/|$)/;
const MEMBRESIAS = new Set(['mv_household_members', 'fam_miembros_hogar']);
const fuente = (codigo: string) => ts.createSourceFile('frontera.tsx', codigo, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

async function archivos(directorio: string): Promise<string[]> {
  try { return (await Promise.all((await readdir(directorio, { withFileTypes: true })).map(async (entrada) => {
    const ruta = path.join(directorio, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : entrada.isFile() && EXTENSIONES.has(path.extname(ruta)) && !/\.test\.tsx?$/.test(ruta) ? [ruta] : [];
  }))).flat(); } catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
}
function directivaCliente(archivo: ts.SourceFile): boolean {
  for (const sentencia of archivo.statements) { if (!ts.isExpressionStatement(sentencia) || !ts.isStringLiteral(sentencia.expression)) return false; if (sentencia.expression.text === 'use client') return true; }
  return false;
}
function importaciones(archivo: ts.SourceFile): string[] {
  const resultados: string[] = []; const visitar = (nodo: ts.Node) => {
    const especificador = (ts.isImportDeclaration(nodo) || ts.isExportDeclaration(nodo)) ? nodo.moduleSpecifier : ts.isImportEqualsDeclaration(nodo) && ts.isExternalModuleReference(nodo.moduleReference) ? nodo.moduleReference.expression : undefined;
    if (especificador && ts.isStringLiteral(especificador)) resultados.push(especificador.text);
    if (ts.isCallExpression(nodo) && nodo.arguments.length === 1 && ts.isStringLiteral(nodo.arguments[0]) && ((ts.isIdentifier(nodo.expression) && nodo.expression.text === 'require') || nodo.expression.kind === ts.SyntaxKind.ImportKeyword)) resultados.push(nodo.arguments[0].text);
    ts.forEachChild(nodo, visitar);
  }; visitar(archivo); return resultados;
}
function usaIdentidadOMembresias(archivo: ts.SourceFile): boolean {
  let encontrada = importaciones(archivo).some((origen) => IDENTIDAD.test(origen)); const visitar = (nodo: ts.Node) => {
    if (ts.isImportDeclaration(nodo) && nodo.importClause?.namedBindings && ts.isNamedImports(nodo.importClause.namedBindings)) encontrada ||= nodo.importClause.namedBindings.elements.some(({ name, propertyName }) => (propertyName ?? name).text === 'ProveedorIdentidad' || name.text === 'resolverAcceso');
    if (ts.isCallExpression(nodo) && ts.isPropertyAccessExpression(nodo.expression)) encontrada ||= nodo.expression.name.text === 'getUser' && ts.isPropertyAccessExpression(nodo.expression.expression) && nodo.expression.expression.name.text === 'auth' || nodo.expression.name.text === 'from' && ts.isStringLiteral(nodo.arguments[0]) && MEMBRESIAS.has(nodo.arguments[0].text);
    ts.forEachChild(nodo, visitar);
  }; visitar(archivo); return encontrada;
}
async function violaciones(directorio: string, prohibido: RegExp) { return (await Promise.all((await archivos(directorio)).map(async (archivo) => importaciones(fuente(await readFile(archivo, 'utf8'))).filter((origen) => prohibido.test(origen)).map((origen) => `${path.relative(RAIZ_SRC, archivo)} -> ${origen}`)))).flat(); }
async function clientesConAdaptadores() { return (await Promise.all((await archivos(RAIZ_SRC)).map(async (archivo) => { const codigo = fuente(await readFile(archivo, 'utf8')); return directivaCliente(codigo) ? importaciones(codigo).filter((origen) => ADAPTADOR_SUPABASE.test(origen)).map((origen) => `${path.relative(RAIZ_SRC, archivo)} -> ${origen}`) : []; }))).flat(); }
async function vehiculosConIdentidad() { return (await Promise.all((await archivos(path.join(RAIZ_SRC, 'modulos/vehiculos'))).map(async (archivo) => usaIdentidadOMembresias(fuente(await readFile(archivo, 'utf8'))) ? [path.relative(RAIZ_SRC, archivo)] : []))).flat(); }

describe('guardas sintácticas de fronteras', () => {
  it('reconoce directivas cliente con BOM, comentarios, comillas y sin punto y coma', () => expect(directivaCliente(fuente('\uFEFF/* composición */\n\'use client\'\nimport cliente from "@/infraestructura/supabase/cliente"'))).toBe(true));
  it('no clasifica como cliente una expresión use client después de código ejecutable', () => expect(directivaCliente(fuente('const listo = true;\n"use client"'))).toBe(false));
  it('distingue contratos, llamadas y literales', () => {
    expect(usaIdentidadOMembresias(fuente('const nota = "auth.getUser y fam_miembros_hogar"; export const valor = nota'))).toBe(false);
    expect(usaIdentidadOMembresias(fuente('async function resolver() { return cliente.auth.getUser(); }'))).toBe(true);
    expect(usaIdentidadOMembresias(fuente('import { ProveedorIdentidad } from "../nucleo-familiar/aplicacion/puertos/alcance-familiar"; export type Prueba = ProveedorIdentidad'))).toBe(true);
    expect(usaIdentidadOMembresias(fuente('cliente.from("fam_miembros_hogar").select()'))).toBe(true);
  });
});
describe('fronteras de la aplicación familiar', () => {
  it('impide que el núcleo familiar importe el módulo de vehículos', async () => expect(await violaciones(path.join(RAIZ_SRC, 'nucleo-familiar'), /(?:^|\/)modulos\/vehiculos(?:\/|$)|^@\/modulos\/vehiculos(?:\/|$)/)).toEqual([]));
  it('impide que los componentes cliente importen adaptadores Supabase', async () => expect(await clientesConAdaptadores()).toEqual([]));
  it('impide que vehículos resuelva identidad o membresías', async () => expect(await vehiculosConIdentidad()).toEqual([]));
});
