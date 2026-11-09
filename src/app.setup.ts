import { INestApplication } from '@nestjs/common';
import { PREFIJO_API } from './common/config';
import { FiltroErrores } from './common/filtro-errores';
import { crearValidationPipe } from './common/validacion';

/** Configuración compartida entre el arranque real y los tests e2e. */
export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix(PREFIJO_API);
  app.useGlobalPipes(crearValidationPipe());
  app.useGlobalFilters(new FiltroErrores());
}
