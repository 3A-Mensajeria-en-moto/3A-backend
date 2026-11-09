import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApiError } from './errores';
import { ES_PUBLICA, ROLES, UsuarioToken } from './decoradores';
import { Rol } from '../usuarios/rol';

/** Valida el JWT del header Authorization y deja el usuario en `req.usuario`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const esPublica = this.reflector.getAllAndOverride<boolean>(ES_PUBLICA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (esPublica) return true;

    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
    if (tipo?.toLowerCase() !== 'bearer' || !token) {
      throw new ApiError(401, 'NO_AUTENTICADO', 'Falta el token de autenticación.');
    }
    try {
      const payload = await this.jwt.verifyAsync(token);
      const usuario: UsuarioToken = {
        id: Number(payload.sub),
        nombre: payload.nombre,
        rol: payload.rol,
      };
      req.usuario = usuario;
      return true;
    } catch {
      throw new ApiError(401, 'NO_AUTENTICADO', 'Token inválido o expirado.');
    }
  }
}

/** Autoriza según @Roles(...). Corre después de JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requeridos?.length) return true;
    const usuario: UsuarioToken | undefined = ctx.switchToHttp().getRequest().usuario;
    if (!usuario || !requeridos.includes(usuario.rol)) {
      throw new ApiError(
        403,
        'SIN_PERMISO',
        `Esta operación requiere rol ${requeridos.join(' o ')}.`,
      );
    }
    return true;
  }
}
