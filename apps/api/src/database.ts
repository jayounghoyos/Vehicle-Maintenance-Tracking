import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

import { entities } from './entities';

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'db']);

function isLocal(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    // an unparseable url is somebody else's error to report, and it is
    // not going to be a local one
    return false;
  }
}

/**
 * Where the database is, in the two shapes it arrives in.
 *
 * Docker compose hands over five separate values, because that is what
 * the postgres image takes. A managed provider hands over one connection
 * string. Supporting both means the same image runs on a laptop and in
 * the cloud without a second code path.
 *
 * DATABASE_URL wins when it is set, since nobody sets it by accident.
 */
export function databaseOptions(env: Env = process.env): DataSourceOptions {
  const shared = {
    type: 'postgres' as const,
    entities,
    // resolved from this file rather than the working directory, so it
    // finds src/migrations under ts-node and dist/migrations under node
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    // never true: the schema is owned by migrations, so a stray entity
    // edit cannot quietly rewrite the database
    synchronize: false,
  };

  if (env.DATABASE_URL) {
    return {
      ...shared,
      url: env.DATABASE_URL,
      /* Managed Postgres refuses an unencrypted connection, and a
       * database on this machine has no certificate to offer, so the
       * host decides rather than another switch to set.
       *
       * Verification stays on: the certificate comes from a public
       * authority node already trusts. The escape hatch is for a
       * provider that signs its own, and turning it off has to be
       * something somebody typed rather than a default nobody noticed. */
      ssl: isLocal(env.DATABASE_URL)
        ? false
        : { rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' },
    };
  }

  return {
    ...shared,
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'mts',
    password: env.DB_PASSWORD ?? 'mts',
    database: env.DB_NAME ?? 'mts',
  };
}
