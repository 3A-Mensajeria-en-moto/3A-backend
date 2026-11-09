import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiError } from './errores';

const CODIGOS_POR_STATUS: Record<number, string> = {
  400: 'SOLICITUD_INVALIDA',
  401: 'NO_AUTENTICADO',
  403: 'SIN_PERMISO',
  404: 'NO_ENCONTRADO',
  409: 'CONFLICTO',
  413: 'CUERPO_DEMASIADO_GRANDE',
};

/** Convierte cualquier error al formato { codigo, mensaje } del contrato. */
@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly logger = new Logger('Errores');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiError) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const detalle = exception.getResponse() as any;
      const crudo = typeof detalle === 'string' ? detalle : detalle?.message;
      const mensaje = Array.isArray(crudo) ? crudo.join(' ') : String(crudo ?? '');
      res.status(status).json({
        codigo: CODIGOS_POR_STATUS[status] ?? 'ERROR',
        mensaje:
          status === 404
            ? 'El recurso no existe.'
            : status === 400
              ? 'La petición no es válida.'
              : mensaje,
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(500).json({
      codigo: 'ERROR_INTERNO',
      mensaje: 'Ocurrió un error inesperado. Intentá de nuevo más tarde.',
    });
  }
}
