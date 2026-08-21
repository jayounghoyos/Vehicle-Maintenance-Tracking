/** Who is holding the token. A member of one fleet, or whoever runs the
 *  service. They are different tables, so the token has to say which. */
export type PrincipalKind = 'user' | 'admin';

export type JwtPayload = {
  sub: number;
  kind: PrincipalKind;
  /** absent for admins: they belong to no organization */
  organizationId?: number;
  role?: string;
};

export type Principal =
  | {
      kind: 'user';
      id: number;
      fullName: string;
      email: string;
      role: string;
      organizationId: number;
    }
  | { kind: 'admin'; id: number; fullName: string; email: string };

export type AuthResponse = {
  accessToken: string;
  principal: Principal;
};
