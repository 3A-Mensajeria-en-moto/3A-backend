import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiError } from './errores';

const MOTIVOS: Record<string, string> = {
  isEmail: 'no es un email válido',
  minLength: 'es demasiado corto',
  maxLength: 'es demasiado largo',
  isIn: 'tiene un valor no permitido',
  isEnum: 'tiene un valor no permitido',
  isInt: 'debe ser un número entero',
  isBoolean: 'debe ser verdadero o falso',
  isString: 'debe ser un texto',
  min: 'es menor al mínimo permitido',
  max: 'supera el máximo permitido',
  matches: 'tiene un formato inválido',
  isArray: 'debe ser una lista',
};

function mensajesDe(e: ValidationError, ruta = ''): string[] {
  const campo = ruta ? `${ruta}.${e.property}` : e.property;
  if (e.children?.length) return e.children.flatMap((h) => mensajesDe(h, campo));
  if (e.value === undefined || e.value === null) {
    return [`El campo ${campo} es obligatorio.`];
  }
  const clave = Object.keys(e.constraints ?? {})[0];
  return [`El campo ${campo} ${MOTIVOS[clave] ?? 'es inválido'}.`];
}

export const crearValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errores) =>
      new ApiError(400, 'VALIDACION', errores.flatMap((e) => mensajesDe(e)).join(' ')),
  });
