import { ALL_PERMISSIONS, Permission } from '../entities';

/**
 * The three roles a new organization starts with, carrying exactly what
 * the three enum values used to carry.
 *
 * Ordinary rows from the moment they are created: the client renames
 * them, changes what they grant, or adds a fourth. Nothing in the code
 * looks them up by name.
 */
export const BASE_ROLES: { name: string; permissions: Permission[] }[] = [
  { name: 'Fleet coordinator', permissions: ALL_PERMISSIONS },
  {
    name: 'Mechanic',
    permissions: [
      Permission.VIEW_VEHICLES,
      Permission.VIEW_TEAM,
      Permission.VIEW_SERVICE_LOG,
      Permission.LOG_SERVICE,
    ],
  },
  {
    name: 'Operations manager',
    permissions: [
      Permission.VIEW_VEHICLES,
      Permission.VIEW_TEAM,
      Permission.VIEW_SERVICE_LOG,
    ],
  },
];

/** Whoever registers the organization runs it, so they get the role
 *  that can staff it. */
export const OWNER_ROLE = BASE_ROLES[0].name;
