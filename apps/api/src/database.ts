import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

import { entities } from './entities';

type Env = Record<string, string | undefined>;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'db']);

/**
 * Says what to do about TLS in the connection string itself, so there is
 * one source of truth rather than a query parameter and a driver option
 * disagreeing.
 *
 * sslmode=require is the ambiguous one: node-postgres verifies the
 * certificate today and warns that a future version will stop, to match
 * libpq, where require means encrypt but do not check who you reached.
 * Spelling out verify-full means the same thing before and after that
 * change, so the day it lands nothing quietly weakens.
 *
 * A database on this machine has no certificate to offer, so the host
 * decides rather than another switch to set.
 */
function withSslMode(raw: string, env: Env): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // an unparseable url is somebody else's error to report
    return raw;
  }

  if (LOCAL_HOSTS.has(url.hostname)) {
    url.searchParams.delete('sslmode');
    url.searchParams.delete('channel_binding');
    return url.toString();
  }

  // turning verification off has to be something somebody typed, never
  // a default nobody noticed
  const mode = env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? 'no-verify' : 'verify-full';
  url.searchParams.set('sslmode', mode);
  return url.toString();
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
    return { ...shared, url: withSslMode(env.DATABASE_URL, env) };
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
