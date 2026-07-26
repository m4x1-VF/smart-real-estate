import type { BetterAuthOptions } from 'better-auth';

type SocialProvidersConfig = NonNullable<BetterAuthOptions['socialProviders']>;

export function buildSocialProviders(): SocialProvidersConfig {
  const providers: SocialProvidersConfig = {};

  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleId && googleSecret) {
    providers.google = {
      clientId: googleId,
      clientSecret: googleSecret,
    };
  }

  const githubId = process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubId && githubSecret) {
    providers.github = {
      clientId: githubId,
      clientSecret: githubSecret,
    };
  }

  return providers;
}
