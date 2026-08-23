import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VehicleModel } from '../entities';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

/* forFeature is only here for vehicle_models, which belongs to no
   organization. Everything else this module touches is tenant owned and
   goes through the tenant repositories. */
@Module({
  imports: [TypeOrmModule.forFeature([VehicleModel])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
