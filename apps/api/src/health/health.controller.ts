import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('meta')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Report the API and its database connection' })
  check(): Promise<HealthCheckResult> {
    // 503 when the database is unreachable, so the answer is never a
    // green tick from an API that cannot read anything
    return this.health.check([() => this.db.pingCheck('database', { timeout: 1500 })]);
  }
}
