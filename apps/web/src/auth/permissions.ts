import type { Principal } from './session';

/**
 * Everything a role can be granted, matching the API's enum exactly.
 *
 * This used to be a table saying which roles could do what. It is now
 * only the list of names: which role grants which of them is the
 * client's decision, stored in their own database rows and read from
 * the session.
 */
export const PERMISSIONS = [
  'view_vehicles',
  'view_team',
  'view_service_log',
  'manage_vehicles',
  'manage_team',
  'manage_schedules',
  'log_service',
  'edit_organization',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** What the checkbox next to each one says. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  view_vehicles: 'See the vehicles',
  view_team: 'See the team',
  view_service_log: 'See the service log',
  manage_vehicles: 'Register and retire vehicles',
  manage_team: 'Add, edit and remove accounts',
  manage_schedules: 'Set maintenance intervals',
  log_service: 'Record work that was done',
  edit_organization: 'Correct the organization details',
};

/** Grouped for the roles editor: opening a screen and changing what is
 *  on it are different kinds of answer. */
export const PERMISSION_GROUPS: { title: string; permissions: Permission[] }[] = [
  {
    title: 'Screens they can open',
    permissions: ['view_vehicles', 'view_team', 'view_service_log'],
  },
  {
    title: 'Things they can change',
    permissions: [
      'manage_vehicles',
      'manage_team',
      'manage_schedules',
      'log_service',
      'edit_organization',
    ],
  },
];

export function can(principal: Principal | null, permission: Permission): boolean {
  // a platform admin runs the service, they are not a member of any fleet
  if (principal?.kind !== 'user') return false;
  return principal.permissions.includes(permission);
}

/** True for a role that may change nothing anywhere, which is worth
 *  saying out loud rather than leaving them to discover it one missing
 *  button at a time. */
export function isReadOnly(principal: Principal | null): boolean {
  const changes = PERMISSION_GROUPS[1].permissions;
  return principal?.kind === 'user' && !changes.some((one) => can(principal, one));
}
