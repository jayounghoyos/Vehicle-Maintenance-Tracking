import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { configure } from '../src/bootstrap';
import { databaseOptions } from '../src/database';

/**
 * The database these tests are allowed to destroy.
 *
 * They start by wiping the schema, so pointing them at the wrong database
 * would delete a day of work. The name has to end in _test and the check
 * below is not negotiable from the outside: an operator can choose which
 * test database, never whether it is one.
 */
const TEST_DATABASE = process.env.TEST_DB_NAME ?? 'mts_test';

/** Long enough for the DTO, the same everywhere so no test invents one. */
export const PASSWORD = 'a-long-enough-password';

if (!TEST_DATABASE.endsWith('_test')) {
  throw new Error(
    `refusing to run against "${TEST_DATABASE}": the name must end in _test`,
  );
}

/** Connects to the maintenance database to create ours if it is missing. */
async function ensureDatabaseExists(): Promise<void> {
  const admin = new DataSource({
    ...databaseOptions({ ...process.env, DATABASE_URL: '', DB_NAME: 'postgres' }),
    // the server catalogue, not our entities
    entities: [],
    migrations: [],
  });

  await admin.initialize();
  try {
    const [existing] = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      TEST_DATABASE,
    ]);
    // identifiers cannot be parameterised, and the name is checked above
    if (!existing) await admin.query(`CREATE DATABASE "${TEST_DATABASE}"`);
  } finally {
    await admin.destroy();
  }
}

/**
 * A running application on an empty, migrated database.
 *
 * The schema comes from the migrations rather than from synchronize, so
 * what the tests exercise is the schema that gets deployed — a migration
 * that fails to describe an entity fails here too.
 */
export async function startTestApp(): Promise<INestApplication> {
  process.env.DATABASE_URL = '';
  process.env.DB_NAME = TEST_DATABASE;

  await ensureDatabaseExists();

  const dataSource = new DataSource(databaseOptions());
  await dataSource.initialize();
  // every run starts from nothing, so a failure leaves no residue that
  // could make the next run pass for the wrong reason
  await dataSource.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await dataSource.runMigrations();
  await dataSource.destroy();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configure(app);
  await app.init();

  // app.close() closes the connection Nest owns, so a test has nothing
  // else to tear down
  return app;
}

/**
 * A fresh organization and the token of the person who runs it.
 *
 * Registering is the only way in: it is what creates the organization,
 * its roles and its first user, so a test that used fixtures instead
 * would be exercising a state the application never produces.
 */
export async function registerOrganization(
  app: INestApplication,
  slug: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      organizationName: `${slug} Fleet`,
      ownerName: 'Ana Restrepo',
      address: 'Cra 43A #1-50, Medellin',
      phone: '3217240555',
      organizationEmail: `contact@${slug}.test`,
      fullName: 'Ana Restrepo',
      email: `owner@${slug}.test`,
      password: PASSWORD,
    })
    .expect(201);

  return response.body.accessToken;
}
