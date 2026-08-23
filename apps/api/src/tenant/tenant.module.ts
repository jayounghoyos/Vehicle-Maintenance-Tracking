import { Global, Module } from '@nestjs/common';

import { TenantRepositories } from './tenant-repository';

/** Global, because every module that touches a client's rows needs it
 *  and importing it everywhere would be noise. */
@Global()
@Module({
  providers: [TenantRepositories],
  exports: [TenantRepositories],
})
export class TenantModule {}
