/**
 * Reglas de arquitectura: protegen los límites del monolito modular.
 * Si este test falla, alguien hizo que un módulo se meta en las tripas de otro.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';

const SRC = join(__dirname, '..', 'src');

/** Lo único que un módulo puede importar de OTRO módulo (su "puerta de entrada"). */
const API_PUBLICA: Record<string, string[] | '*'> = {
  common: '*',
  usuarios: ['usuarios.module', 'usuarios.service', 'rol'],
  envios: ['envios.module', 'envios.service', 'estado-envio'],
  mapas: ['mapas.module', 'servicio-mapas'],
  notificaciones: ['notificaciones.module', 'notificaciones.service'],
  auth: ['auth.module'],
  cadetes: ['cadetes.module'],
  seed: ['seed.module'],
};

/**
 * Excepciones deliberadas, cada una con su motivo. Agregar una acá debe ser una decisión consciente.
 * Son todas la misma razón: una clave foránea / tipo hacia la entidad Usuario.
 */
const EXCEPCIONES: Record<string, string[]> = {
  'envios/envio.entity.ts': ['usuarios/usuario.entity.ts'], // FK cliente y cadete
  'envios/cambio-estado.entity.ts': ['usuarios/usuario.entity.ts'], // FK realizadoPor
  'envios/envio.mapper.ts': ['usuarios/usuario.entity.ts'], // tipo para armar { id, nombre }
  'auth/auth.service.ts': ['usuarios/usuario.entity.ts'], // tipo para armar la respuesta
};

/** Raíces de composición: arman la app, pueden conocer todos los módulos. */
const RAICES = new Set(['(raiz)', 'cli']);

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const moduloDe = (rel: string) => (rel.includes('/') ? rel.split('/')[0] : '(raiz)');

interface Import {
  desde: string; // ruta relativa a src, con extensión
  hacia: string; // idem
}

function imports(): Import[] {
  const salida: Import[] = [];
  for (const abs of archivos(SRC)) {
    const desde = relative(SRC, abs).replace(/\\/g, '/');
    const texto = readFileSync(abs, 'utf8');
    for (const m of texto.matchAll(/from\s+'(\.{1,2}\/[^']+)'/g)) {
      const hacia = relative(SRC, join(dirname(abs), m[1])).replace(/\\/g, '/') + '.ts';
      salida.push({ desde, hacia });
    }
  }
  return salida;
}

const TODOS = imports();
const cruzados = TODOS.filter(({ desde, hacia }) => {
  const a = moduloDe(desde);
  const b = moduloDe(hacia);
  return a !== b && !RAICES.has(a);
});

describe('Arquitectura: monolito modular', () => {
  it('un módulo solo importa la API pública de otro módulo', () => {
    const violaciones = cruzados
      .filter(({ desde, hacia }) => {
        if (EXCEPCIONES[desde]?.includes(hacia)) return false;
        const publica = API_PUBLICA[moduloDe(hacia)];
        if (publica === '*') return false;
        const archivo = hacia.split('/').pop()!.replace(/\.ts$/, '');
        return !publica?.includes(archivo);
      })
      .map(({ desde, hacia }) => `${desde}  →  ${hacia}`);
    expect(violaciones).toEqual([]);
  });

  it('no hay dependencias circulares entre módulos', () => {
    const grafo = new Map<string, Set<string>>();
    for (const { desde, hacia } of cruzados) {
      const a = moduloDe(desde);
      if (!grafo.has(a)) grafo.set(a, new Set());
      grafo.get(a)!.add(moduloDe(hacia));
    }
    const ciclos: string[] = [];
    const visitar = (n: string, camino: string[]) => {
      if (camino.includes(n)) {
        ciclos.push([...camino.slice(camino.indexOf(n)), n].join(' → '));
        return;
      }
      for (const v of grafo.get(n) ?? []) visitar(v, [...camino, n]);
    };
    for (const n of grafo.keys()) visitar(n, []);
    expect([...new Set(ciclos)]).toEqual([]);
  });

  it('ningún módulo re-exporta TypeOrmModule (dejaría leer sus tablas desde afuera)', () => {
    const malos = archivos(SRC)
      .filter((f) => f.endsWith('.module.ts'))
      .filter((f) => /exports:\s*\[[^\]]*TypeOrmModule/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(malos).toEqual([]);
  });
});
