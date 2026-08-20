import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { entities } from './entities';

// the CLI runs outside Nest, so it reads the same .env by itself
config({ path: ['.env', '../../.env'], quiet: true });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'mts',
  password: process.env.DB_PASSWORD ?? 'mts',
  database: process.env.DB_NAME ?? 'mts',
  entities,
  migrations: ['src/migrations/*.ts'],
});
