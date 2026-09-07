import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { registerOrganization, startTestApp } from './harness';

/**
 * The route the client described in the RFP, start to finish: register a
 * vehicle, give it a maintenance rule, let it fall overdue, log the
 * service, and watch the dashboard and the reports agree about what
 * happened.
 *
 * Each step is an acceptance criterion from the issues (US-01 to US-05).
 * They run in order and share state on purpose: the point is that the
 * screens tell one consistent story, which no test of a single endpoint
 * can show.
 */
describe('fleet workflow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let vehicleId: number;
  let taskId: number;
  let scheduleId: number;

  const http = () => request(app.getHttpServer());
  const auth = () => ({ authorization: `Bearer ${token}` });

  /** Far enough back that a 30-day rule is unambiguously overdue. */
  const isoDaysAgo = (days: number) =>
    new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  beforeAll(async () => {
    app = await startTestApp();
    token = await registerOrganization(app, 'city');
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('US-01: registers a vehicle', async () => {
    const created = await http()
      .post('/api/vehicles')
      .set(auth())
      .send({
        plate: 'ABC123',
        make: 'Chevrolet',
        model: 'NHR',
        year: 2019,
        odometerKm: 128450,
      })
      .expect(201);

    vehicleId = created.body.id;

    const detail = await http().get(`/api/vehicles/${vehicleId}`).set(auth()).expect(200);
    expect(detail.body).toMatchObject({
      plate: 'ABC123',
      make: 'Chevrolet',
      model: 'NHR',
    });
  });

  it('refuses a second vehicle with the same plate', async () => {
    await http()
      .post('/api/vehicles')
      .set(auth())
      .send({ plate: 'ABC123', make: 'Renault', model: 'Kangoo' })
      .expect(409);
  });

  it('imports a batch of vehicles in one request', async () => {
    await http()
      .post('/api/vehicles/bulk')
      .set(auth())
      .send({
        vehicles: [
          { plate: 'DEF456', make: 'Renault', model: 'Kangoo', odometerKm: 96210 },
          { plate: 'GHI789', make: 'Hyundai', model: 'H100', odometerKm: 143980 },
        ],
      })
      .expect(201);

    const all = await http().get('/api/vehicles').set(auth()).expect(200);
    expect(all.body).toHaveLength(3);
  });

  it('edits a vehicle and takes it off the road', async () => {
    await http()
      .patch(`/api/vehicles/${vehicleId}`)
      .set(auth())
      .send({ status: 'in_shop', odometerKm: 130000 })
      .expect(200);

    const detail = await http().get(`/api/vehicles/${vehicleId}`).set(auth()).expect(200);
    expect(detail.body).toMatchObject({ status: 'in_shop', odometerKm: 130000 });
  });

  it('US-02: defines a maintenance schedule', async () => {
    const task = await http()
      .post('/api/schedules/tasks')
      .set(auth())
      .send({ name: 'Oil change' })
      .expect(201);
    taskId = task.body.id;

    const schedule = await http()
      .post('/api/schedules')
      .set(auth())
      .send({ vehicleId, taskId, intervalDays: 30 })
      .expect(201);
    scheduleId = schedule.body.id;

    const list = await http().get('/api/schedules').set(auth()).expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('does not name two maintenance tasks the same', async () => {
    await http()
      .post('/api/schedules/tasks')
      .set(auth())
      .send({ name: 'oil change' })
      .expect(409);
  });

  it('US-04: reports the vehicle overdue once the interval has passed', async () => {
    // the rule is 30 days and the last service was 90 days ago
    await http()
      .post('/api/service-events')
      .set(auth())
      .send({
        vehicleId,
        scheduleId,
        taskName: 'Oil change',
        type: 'preventive',
        performedAt: isoDaysAgo(90),
        odometerKm: 120000,
      })
      .expect(201);

    const dashboard = await http().get('/api/dashboard').set(auth()).expect(200);
    expect(dashboard.body.counts.overdue).toBe(1);
    expect(
      dashboard.body.attention.map((item: { plate: string }) => item.plate),
    ).toContain('ABC123');
  });

  it('US-03: logging today’s service clears the overdue', async () => {
    await http()
      .post('/api/service-events')
      .set(auth())
      .send({
        vehicleId,
        scheduleId,
        taskName: 'Oil change',
        type: 'preventive',
        performedAt: isoDaysAgo(0),
        odometerKm: 130000,
      })
      .expect(201);

    const dashboard = await http().get('/api/dashboard').set(auth()).expect(200);
    expect(dashboard.body.counts.overdue).toBe(0);
  });

  it('US-05: keeps the vehicle’s maintenance history, newest first', async () => {
    const log = await http()
      .get(`/api/service-events?vehicleId=${vehicleId}`)
      .set(auth())
      .expect(200);

    expect(log.body).toHaveLength(2);
    expect(log.body[0].performedAt >= log.body[1].performedAt).toBe(true);
  });

  it('will not delete a schedule that services were logged against', async () => {
    await http().delete(`/api/schedules/${scheduleId}`).set(auth()).expect(409);
  });

  it('edits the interval on an existing schedule', async () => {
    await http()
      .patch(`/api/schedules/${scheduleId}`)
      .set(auth())
      .send({ intervalDays: 60, intervalKm: 5000 })
      .expect(200);

    const list = await http().get('/api/schedules').set(auth()).expect(200);
    expect(list.body[0]).toMatchObject({ intervalDays: 60, intervalKm: 5000 });
  });

  it('counts the same services in the reports as in the log', async () => {
    const reports = await http().get('/api/reports?months=12').set(auth()).expect(200);

    expect(reports.body.totalEvents).toBe(2);
    const byTask = reports.body.metrics.servicesByTask;
    expect(byTask).toEqual([{ key: 'Oil change', label: 'Oil change', value: 2 }]);
  });

  it('leaves an empty month in the series instead of skipping it', async () => {
    const reports = await http().get('/api/reports?months=12').set(auth()).expect(200);

    // twelve buckets whatever happened in them, or a chart would draw a
    // trend line through months that were never there
    expect(reports.body.metrics.servicesPerMonth).toHaveLength(12);
    expect(
      reports.body.metrics.servicesPerMonth.some((p: { value: number }) => p.value === 0),
    ).toBe(true);
  });

  it('deletes a vehicle nothing is attached to', async () => {
    const spare = await http()
      .post('/api/vehicles')
      .set(auth())
      .send({ plate: 'ZZZ000', make: 'Renault', model: 'Master' })
      .expect(201);

    await http().delete(`/api/vehicles/${spare.body.id}`).set(auth()).expect(204);
    await http().get(`/api/vehicles/${spare.body.id}`).set(auth()).expect(404);
  });

  it('keeps a vehicle that has a service history', async () => {
    // its log is the record the client came here for, and deleting the
    // vehicle would take it with them
    await http().delete(`/api/vehicles/${vehicleId}`).set(auth()).expect(409);
  });
});
