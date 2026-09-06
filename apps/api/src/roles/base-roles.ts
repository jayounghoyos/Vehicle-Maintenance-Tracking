import { ALL_PERMISSIONS, Permission } from '../entities';

/**
 * The three roles a new organization starts with.
 *
 * Reports read the whole fleet at once, so they go to the two roles that
 * answer for it and not to the mechanic, who works one vehicle at a
 * time. A client that disagrees ticks the box.
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
      Permission.VIEW_REPORTS,
    ],
  },
];

/** Whoever registers the organization runs it, so they get the role
 *  that can staff it. */
export const OWNER_ROLE = BASE_ROLES[0].name;
