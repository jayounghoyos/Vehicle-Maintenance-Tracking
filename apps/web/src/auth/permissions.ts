import type { Principal } from './session';

/**
 * What each role may change, in one table.
 *
 * The screens ask this instead of comparing role strings themselves, so
 * a role that gains or loses something is one line here rather than a
 * hunt through the components. The API enforces the same split with its
 * own guards: this only decides what to draw, never what is allowed.
 *
 * Reading is not listed. Everybody in an organization sees the same
 * fleet, the same team and the same history; the roles differ in what
 * they may change, not in what they may know.
 */
const RULES = {
  /** add and remove accounts */
  manageTeam: ['fleet_coordinator'],
  /** correct the registry details */
  editOrganization: ['fleet_coordinator'],
  /** record work that was done */
  logService: ['fleet_coordinator', 'mechanic'],
  /** register vehicles and retire them */
  manageVehicles: ['fleet_coordinator'],
  /** set the intervals that decide when a vehicle is due */
  manageSchedules: ['fleet_coordinator'],
} as const satisfies Record<string, readonly string[]>;

export type Permission = keyof typeof RULES;

const PERMISSIONS = Object.keys(RULES) as Permission[];

export function can(principal: Principal | null, permission: Permission): boolean {
  // a platform admin runs the service, they are not a member of any fleet
  if (principal?.kind !== 'user') return false;
  return (RULES[permission] as readonly string[]).includes(principal.role);
}

/** True for a role that may change nothing anywhere, which is worth
 *  saying out loud in the interface rather than leaving them to discover
 *  it one missing button at a time. Derived, so it stays true if the
 *  table above changes. */
export function isReadOnly(principal: Principal | null): boolean {
  return (
    principal?.kind === 'user' &&
    !PERMISSIONS.some((permission) => can(principal, permission))
  );
}
