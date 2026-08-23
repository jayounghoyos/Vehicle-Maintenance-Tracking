import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Organization } from '../entities';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [
    // organizations is the tenant, not something a tenant owns
    TypeOrmModule.forFeature([Organization]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
