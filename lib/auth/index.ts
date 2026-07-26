import 'server-only';
import { betterAuth } from 'better-auth';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { getDb } from '@/lib/db/client';
import { dash } from '@better-auth/infra';

export const auth = betterAuth({
  database: {
    dialect: new PostgresJSDialect({ postgres: getDb() }),
    type: 'postgres',
    transaction: false,
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    'http://localhost:3000',
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
      : []),
  ],
  plugins: [dash()],
});

export type Session = typeof auth.$Infer.Session;
