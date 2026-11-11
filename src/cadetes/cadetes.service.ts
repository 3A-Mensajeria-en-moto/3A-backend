import { Injectable } from '@nestjs/common';
import { EnviosService } from '../envios/envios.service';
import { UsuariosService } from '../usuarios/usuarios.service';

/**
 * Compone datos de otros dos módulos: los cadetes (usuarios) y su carga de trabajo (envíos).
 * No lee ninguna tabla directamente: le pide cada dato a su dueño.
 */
@Injectable()
export class CadetesService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly envios: EnviosService,
  ) {}

  async listar(soloActivos: boolean) {
    const [cadetes, activos] = await Promise.all([
      this.usuarios.listarCadetes(soloActivos),
      this.envios.contarActivosPorCadete(),
    ]);
    return cadetes.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? null,
      activo: c.activo,
      enviosActivos: activos.get(c.id) ?? 0,
    }));
  }
}
