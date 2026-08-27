import { Injectable } from '@nestjs/common';

import { TenantRepositories } from '../tenant/tenant-repository';

@Injectable()
export class ServiceEventsService {
  constructor(private readonly tenants: TenantRepositories) {}
}
