import { Test } from '@nestjs/testing';

import { ServiceEvent } from '../entities';
import { TenantRepositories } from '../tenant/tenant-repository';
import { ReportsService } from './reports.service';

const ORG = 10;
/* A fixed today, so the months the service lays out are the months the
   assertions name. */
const TODAY = new Date('2026-09-15T00:00:00Z');

describe('ReportsService', () => {
  let service: ReportsService;
  /** What the grouped query would have returned, and what it was asked. */
  let buckets: { bucket: string; count: string }[];
  let askedFrom: string | undefined;

  beforeEach(async () => {
    buckets = [];
    askedFrom = undefined;

    /* mockReturnThis rather than naming the object inside itself, which
       is what the other service specs here do and what keeps the chain
       from being inferred as any. */
    const builder = {
      andWhere: jest.fn(function (this: unknown, _: string, params: { from: string }) {
        askedFrom = params.from;
        return this;
      }),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(() => Promise.resolve(buckets)),
    };

    const empty = { find: jest.fn().mockResolvedValue([]) };
    const tenants = {
      for: jest.fn((entity: unknown) =>
        entity === ServiceEvent ? { builder: jest.fn().mockReturnValue(builder) } : empty,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ReportsService, { provide: TenantRepositories, useValue: tenants }],
    }).compile();

    service = moduleRef.get(ReportsService);
  });

  it('asks for the first day of the first month in the window', async () => {
    await service.build(ORG, 3, TODAY);
    expect(askedFrom).toBe('2026-07-01');

    await service.build(ORG, 12, TODAY);
    expect(askedFrom).toBe('2025-10-01');
  });

  it('lays out every month, so one with nothing in it is a zero and not a gap', async () => {
    buckets = [
      { bucket: '2026-07', count: '4' },
      { bucket: '2026-09', count: '1' },
    ];

    const { metrics } = await service.build(ORG, 3, TODAY);

    expect(metrics.servicesPerMonth.map((point) => [point.key, point.value])).toEqual([
      ['2026-07', 4],
      ['2026-08', 0],
      ['2026-09', 1],
    ]);
  });

  it('counts only what the window covers, so the tile agrees with the chart', async () => {
    buckets = [
      { bucket: '2026-07', count: '4' },
      { bucket: '2026-08', count: '3' },
    ];

    const { totalEvents, metrics } = await service.build(ORG, 3, TODAY);
    const drawn = metrics.servicesPerMonth.reduce((sum, point) => sum + point.value, 0);

    expect(totalEvents).toBe(7);
    expect(totalEvents).toBe(drawn);
  });

  it('gives every metric an answer even with nothing recorded', async () => {
    const { metrics, totalEvents } = await service.build(ORG, 12, TODAY);

    expect(totalEvents).toBe(0);
    expect(metrics.servicesPerMonth).toHaveLength(12);
    expect(metrics.fleetByState.map((point) => point.key)).toEqual([
      'overdue',
      'due_soon',
      'on_track',
    ]);
  });
});
