import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PASSWORD, registerOrganization, startTestApp } from './harness';

/**
 * What each role may open, checked through the guards.
 *
 * The acceptance criterion is the one the client stated: a mechanic logs
 * work and does not read the reports. Asserting it against BASE_ROLES
 * would only prove the list says so; going through HTTP proves the guard
 * on the controller enforces it.
 */
describe('role permissions (e2e)', () => {
  let app: INestApplication;
  let coordinatorToken: string;
  let mechanicToken: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await startTestApp();

    // whoever registers runs the fleet, so this token holds everything
    coordinatorToken = await registerOrganization(app, 'city');

    const roles = await http()
      .get('/api/roles')
      .set('authorization', `Bearer ${coordinatorToken}`)
      .expect(200);
    const mechanic = roles.body.find(
      (role: { name: string }) => role.name === 'Mechanic',
    );

    await http()
      .post('/api/team')
      .set('authorization', `Bearer ${coordinatorToken}`)
      .send({
        fullName: 'Carlos Mejia',
        email: 'carlos@city.test',
        password: PASSWORD,
        roleId: mechanic.id,
      })
      .expect(201);

    const signedIn = await http()
      .post('/api/auth/login')
      .send({ email: 'carlos@city.test', password: PASSWORD })
      .expect(200);

    mechanicToken = signedIn.body.accessToken;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('lets a fleet coordinator read the reports', async () => {
    await http()
      .get('/api/reports')
      .set('authorization', `Bearer ${coordinatorToken}`)
      .expect(200);
  });

  it('keeps a mechanic out of the reports', async () => {
    await http()
      .get('/api/reports')
      .set('authorization', `Bearer ${mechanicToken}`)
      .expect(403);
  });

  it('still lets that mechanic see the vehicles they work on', async () => {
    await http()
      .get('/api/vehicles')
      .set('authorization', `Bearer ${mechanicToken}`)
      .expect(200);
  });

  it('does not let a mechanic register a vehicle', async () => {
    await http()
      .post('/api/vehicles')
      .set('authorization', `Bearer ${mechanicToken}`)
      .send({ plate: 'ABC123', make: 'Chevrolet', model: 'NHR' })
      .expect(403);
  });
});
