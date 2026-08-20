import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { MaintenanceTask } from './maintenance-task.entity';
import { Organization } from './organization.entity';
import { ServiceEventPhoto } from './service-event-photo.entity';
import { ServiceEvent } from './service-event.entity';
import { User } from './user.entity';
import { VehicleModel } from './vehicle-model.entity';
import { Vehicle } from './vehicle.entity';

/** The eight tables in docs/design/data_model.dbml. Nothing more. */
export const entities = [
  Organization,
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
  ServiceEvent,
  ServiceEventPhoto,
  User,
  Vehicle,
  VehicleModel,
};
