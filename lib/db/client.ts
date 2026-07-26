import 'server-only';
import postgres from 'postgres';

export type Sql = ReturnType<typeof postgres>;

let cached: Sql | null = null;

export function getDb(): Sql {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url || url === '') {
    throw new Error(
      'DATABASE_URL is required (set it in .env.local or your environment).',
    );
  }

  // Note: `postgres-js` v3 renamed `connection_limit` to `max`. We pin the
  // pool to a single connection to keep serverless cold-start behaviour the
  // same as the original design (one socket per Node runtime).
  cached = postgres(url, {
    max: 1,
    prepare: false,
  });
  return cached;
}
