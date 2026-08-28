import type { Permission } from '../entities';

/** Who is holding the token. A member of one fleet, or whoever runs the
 *  service. They are different tables, so the token has to say which. */
export type PrincipalKind = 'user' | 'admin';

/** Deliberately thin: everything else is read from the database on each
 *  request, so a role edited a second ago already applies. */
export type JwtPayload = {
  sub: number;
  kind: PrincipalKind;
  /** absent for admins: they belong to no organization */
  organizationId?: number;
};

export type Principal =
  | {
      kind: 'user';
      id: number;
      fullName: string;
      email: string;
      roleId: number;
      roleName: string;
      permissions: Permission[];
      organizationId: number;
    }
  | { kind: 'admin'; id: number; fullName: string; email: string };

export type AuthResponse = {
  accessToken: string;
  principal: Principal;
};
