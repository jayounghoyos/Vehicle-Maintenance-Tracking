import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { MaintenanceTask } from './maintenance-task.entity';
import { Organization } from './organization.entity';
import { PlatformAdmin } from './platform-admin.entity';
import { RolePermission } from './role-permission.entity';
import { Role } from './role.entity';
import { ServiceEventPhoto } from './service-event-photo.entity';
import { ServiceEvent } from './service-event.entity';
import { User } from './user.entity';
import { VehicleModel } from './vehicle-model.entity';
import { Vehicle } from './vehicle.entity';

/** The eleven tables in docs/design/data_model.dbml. Nothing more. */
export const entities = [
  Organization,
  PlatformAdmin,
  Role,
  RolePermission,
  User,
  VehicleModel,
  Vehicle,
  MaintenanceTask,
  MaintenanceSchedule,
  ServiceEvent,
  ServiceEventPhoto,
];

export * from './enums';
export {
  MaintenanceSchedule,
  MaintenanceTask,
  Organization,
  PlatformAdmin,
  Role,
  RolePermission,
  ServiceEvent,
  ServiceEventPhoto,
  User,
  Vehicle,
  VehicleModel,
};
