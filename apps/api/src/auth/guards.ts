import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import type { Principal } from './auth.types';
import { Permission } from '../entities';

/** Requires a valid token. Nothing more. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export const PERMISSIONS_KEY = 'permissions';

/**
 * What the caller's role has to grant. Names a permission rather than a
 * role, because which role carries it is now the client's decision and
 * changes without anybody touching this file.
 */
export const Requires = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: Principal }>();
    // admins run the service and belong to no fleet, so they satisfy
    // nothing here: they have their own guard
    if (user?.kind !== 'user') throw new ForbiddenException('Not allowed');
    if (!required.every((permission) => user.permissions.includes(permission))) {
      throw new ForbiddenException('Not allowed');
    }
    return true;
  }
}

/** Only whoever runs the service. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user?: Principal }>();
    if (user?.kind !== 'admin') throw new ForbiddenException('Admins only');
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal =>
    context.switchToHttp().getRequest<{ user: Principal }>().user,
);
