import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => {
  const { SetMetadata } = require('@nestjs/common');
  return SetMetadata(ROLES_KEY, roles);
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Token requerido');

    try {
      const secret = process.env.JWT_SECRET || 'directorio-secret-key-2024';
      const payload = jwt.verify(token, secret) as any;
      request['user'] = payload;

      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        throw new UnauthorizedException('No tienes permisos para esta acción');
      }

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
  }
}
