import { describe, expect, it } from 'vitest';
import { toggleFavoriteSchema } from '@/lib/favorites/schemas';

describe('toggleFavoriteSchema', () => {
  it('accepts a valid UUID', () => {
    const result = toggleFavoriteSchema.safeParse({
      propertyId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-uuid string', () => {
    const result = toggleFavoriteSchema.safeParse({
      propertyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = toggleFavoriteSchema.safeParse({
      propertyId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a uuid-like string with invalid format', () => {
    const result = toggleFavoriteSchema.safeParse({
      propertyId: 'a1b2c3d4e5f67890abcdef1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing propertyId', () => {
    const result = toggleFavoriteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
