import { afterEach, describe, expect, it } from 'vitest';
import { buildSocialProviders } from '@/lib/auth/social-providers';

describe('buildSocialProviders', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns config with Google and GitHub when all env vars are present', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GITHUB_CLIENT_ID = 'github-id';
    process.env.GITHUB_CLIENT_SECRET = 'github-secret';

    const result = buildSocialProviders();

    expect(result.google).toBeDefined();
    expect(result.google!.clientId).toBe('google-id');
    expect(result.google!.clientSecret).toBe('google-secret');
    expect(result.github).toBeDefined();
    expect(result.github!.clientId).toBe('github-id');
    expect(result.github!.clientSecret).toBe('github-secret');
  });

  it('omits Google when GOOGLE_CLIENT_ID is missing', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    process.env.GITHUB_CLIENT_ID = 'github-id';
    process.env.GITHUB_CLIENT_SECRET = 'github-secret';

    const result = buildSocialProviders();

    expect(result.google).toBeUndefined();
    expect(result.github).toBeDefined();
  });

  it('omits GitHub when GITHUB_CLIENT_ID is missing', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
    delete process.env.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = 'github-secret';

    const result = buildSocialProviders();

    expect(result.google).toBeDefined();
    expect(result.github).toBeUndefined();
  });

  it('returns empty object when no env vars are set', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    const result = buildSocialProviders();

    expect(Object.keys(result)).toHaveLength(0);
  });
});
