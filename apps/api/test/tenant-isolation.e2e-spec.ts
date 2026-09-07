import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { registerOrganization, startTestApp } from './harness';

/**
 * The one invariant the whole product rests on: an organization sees its
 * own fleet and nothing else.
 *
 * The unit tests cannot answer this. They hand the services a mocked
 * query builder, so a query that quietly drops the organization
 * condition, by using .where, which replaces it, instead of .andWhere,
 * still passes them. Only a real database tells the difference.
 */
describe('tenant isolation (e2e)', () => {
  let app: INestApplication;
  let cityToken: string;
  let rivalToken: string;
  let rivalVehicleId: number;

  const http = () => request(app.getHttpServer());

  async function addVehicle(token: string, plate: string): Promise<number> {
    const response = await http()
      .post('/api/vehicles')
      .set('authorization', `Bearer ${token}`)
      .send({ plate, make: 'Chevrolet', model: 'NHR', year: 2019, odometerKm: 1000 })
      .expect(201);

    return response.body.id;
  }

  beforeAll(async () => {
    app = await startTestApp();

    cityToken = await registerOrganization(app, 'city');
    rivalToken = await registerOrganization(app, 'rival');

    await addVehicle(cityToken, 'ABC123');
    rivalVehicleId = await addVehicle(rivalToken, 'XYZ999');
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('lists only the vehicles of the organization asking', async () => {
    const response = await http()
      .get('/api/vehicles')
      .set('authorization', `Bearer ${cityToken}`)
      .expect(200);

    expect(response.body.map((vehicle: { plate: string }) => vehicle.plate)).toEqual([
      'ABC123',
    ]);
  });

  it('does not hand over another organization’s vehicle by id', async () => {
    // 404, not 403: whether that id exists is not something another
    // organization is entitled to learn
    await http()
      .get(`/api/vehicles/${rivalVehicleId}`)
      .set('authorization', `Bearer ${cityToken}`)
      .expect(404);
  });

  it('counts only its own fleet in the reports', async () => {
    const response = await http()
      .get('/api/reports?months=12')
      .set('authorization', `Bearer ${cityToken}`)
      .expect(200);

    const fleet = response.body.metrics.fleetByStatus.reduce(
      (sum: number, point: { value: number }) => sum + point.value,
      0,
    );
    expect(fleet).toBe(1);
  });

  it('gives each organization its own maintenance task of the same name', async () => {
    // "Oil change" is what every fleet calls it. Looking one up by name
    // without the organization condition hands the second fleet the
    // first one's row, and from then on their schedules share it.
    const create = (token: string) =>
      http()
        .post('/api/schedules/tasks')
        .set('authorization', `Bearer ${token}`)
        .send({ name: 'Oil change' })
        .expect(201);

    const city = await create(cityToken);
    const rival = await create(rivalToken);

    expect(rival.body.id).not.toBe(city.body.id);
  });

  it('turns away a request with no token', async () => {
    await http().get('/api/vehicles').expect(401);
  });
});
