/* The enums in docs/design/data_model.dbml. enumName pins the postgres
 * type name so the database matches the diagram, not TypeORM's
 * generated default. */

/**
 * Everything a role can be granted. Developer-owned, not client-owned:
 * a client composes roles out of this list but cannot invent an entry,
 * because every entry is a guard or a route that has to exist in code.
 *
 * The dashboard is not here. It is where signing in lands you, and a
 * role that could not open it would have nowhere to go.
 */
export enum Permission {
  VIEW_VEHICLES = 'view_vehicles',
  VIEW_TEAM = 'view_team',
  VIEW_SERVICE_LOG = 'view_service_log',
  MANAGE_VEHICLES = 'manage_vehicles',
  MANAGE_TEAM = 'manage_team',
  MANAGE_SCHEDULES = 'manage_schedules',
  LOG_SERVICE = 'log_service',
  EDIT_ORGANIZATION = 'edit_organization',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export enum VehicleStatus {
  ACTIVE = 'active',
  IN_SHOP = 'in_shop',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum ServiceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
}
