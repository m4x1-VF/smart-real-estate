import 'server-only';
import { betterAuth } from 'better-auth';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { getDb } from '@/lib/db/client';
import { dash } from '@better-auth/infra';
import { buildSocialProviders } from '@/lib/auth/social-providers';

export const auth = betterAuth({
  database: {
    dialect: new PostgresJSDialect({ postgres: getDb() }),
    type: 'postgres',
    transaction: false,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      // In development, log the verification URL. In production, integrate with an email service.
      console.log(
        `[Email Verification] To: ${user.email}, URL: ${url}`
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (604800 seconds)
    updateAge: 60 * 15, // 15 minutes (900 seconds) — sliding window refresh
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes (300 seconds) — reduces DB calls
    },
  },
  socialProviders: buildSocialProviders(),
  trustedOrigins: [
    'http://localhost:3000',
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
      : []),
  ],
  plugins: [dash()],
});

export type Session = typeof auth.$Infer.Session;
