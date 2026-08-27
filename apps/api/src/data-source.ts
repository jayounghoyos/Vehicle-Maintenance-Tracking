import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { databaseOptions } from './database';

// the CLI runs outside Nest, so it reads the same .env by itself
config({ path: ['.env', '../../.env'], quiet: true });

export default new DataSource(databaseOptions());
