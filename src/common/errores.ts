import { HttpException } from '@nestjs/common';

/**
 * Error de negocio con el formato del contrato: { codigo, mensaje }.
 * `codigo` es estable (lo usa el frontend); `mensaje` es legible para el usuario.
 */
export class ApiError extends HttpException {
  constructor(
    status: number,
    public readonly codigo: string,
    mensaje: string,
  ) {
    super({ codigo, mensaje }, status);
  }
}

export const noEncontrado = (mensaje = 'El recurso no existe.') =>
  new ApiError(404, 'NO_ENCONTRADO', mensaje);
