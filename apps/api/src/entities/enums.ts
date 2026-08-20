/* The three enums in docs/design/data_model.dbml. enumName pins the
 * postgres type name so the database matches the diagram, not TypeORM's
 * generated default. */

export enum UserRole {
  FLEET_COORDINATOR = 'fleet_coordinator',
  MECHANIC = 'mechanic',
  OPERATIONS_MANAGER = 'operations_manager',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  IN_SHOP = 'in_shop',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum ServiceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
}
