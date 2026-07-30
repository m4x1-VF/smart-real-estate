import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type QueryCall = { text: string; values: unknown[] };

const sqlCalls: QueryCall[] = [];
let nextResults: unknown[] = [];

function renderTemplate(
  strings: TemplateStringsArray | unknown[],
  values: unknown[],
): string {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += String(strings[i] ?? '');
    if (i < values.length) {
      const val = values[i];
      if (typeof val === 'string' && val.trim() !== '') {
        out += val;
      } else {
        out += '${...}';
      }
    }
  }
  return out;
}

function isMainQuery(text: string): boolean {
  return /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(text);
}

function renderObjectKeys(obj: Record<string, unknown>): string {
  return Object.keys(obj).join(', ');
}

const fakeSql = ((...args: unknown[]) => {
  const isTemplateCall =
    args.length >= 1 &&
    typeof args[0] === 'object' &&
    args[0] !== null &&
    'raw' in (args[0] as Record<string, unknown>) &&
    'length' in (args[0] as Record<string, unknown>);

  if (isTemplateCall) {
    const strings = args[0] as TemplateStringsArray;
    const values = args.slice(1) as unknown[];
    const text = renderTemplate(strings, values);
    sqlCalls.push({ text, values });

    if (isMainQuery(text)) {
      const result = nextResults.shift();
      return Promise.resolve(result ?? []);
    }
    return text;
  }

  const first = args[0];
  if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
    const text = renderObjectKeys(first as Record<string, unknown>);
    sqlCalls.push({ text, values: args.slice(1) });
    return first;
  }

  sqlCalls.push({
    text: args.map((a) => String(a)).join(' '),
    values: args.slice(1),
  });
  return first;
}) as ((...args: unknown[]) => unknown) & {
  unsafe: (s: string) => string;
  array: (arr: unknown) => unknown;
};

fakeSql.unsafe = (s: string) => s;
fakeSql.array = (arr: unknown) => arr;

vi.mock('@/lib/db/client', () => ({
  getDb: () => fakeSql,
}));

async function importProperties(): Promise<typeof import('@/lib/db/properties')> {
  sqlCalls.length = 0;
  nextResults = [];
  return import('@/lib/db/properties');
}

function setNextResult(value: unknown): void {
  nextResults.push(value);
}

describe('lib/db/properties', () => {
  beforeEach(async () => {
    await importProperties();
  });

  describe('listProperties (R3)', () => {
    it('returns properties and totalCount with no filters', async () => {
      const { listProperties } = await importProperties();
      const row = makeRow({ id: 'p1', title: 'Modern villa' });
      setNextResult([row]);
      setNextResult([{ count: 1 }]);

      const result = await listProperties({ page: 1, pageSize: 8 });

      expect(result.properties).toHaveLength(1);
      expect(result.properties[0]?.id).toBe('p1');
      expect(result.totalCount).toBe(1);

      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls).toHaveLength(2);
      const selectCall = mainCalls[0]!;
      expect(selectCall.text).toContain('FROM properties');
      expect(selectCall.text).toContain('is_active = true');
      expect(selectCall.text).toContain('ORDER BY created_at DESC');
      expect(selectCall.text).toMatch(/LIMIT\s+\$\{\.\.\.\}/);
      expect(selectCall.text).toMatch(/OFFSET\s+\$\{\.\.\.\}/);
    });

    it('passes filter values to sql for location, price and beds', async () => {
      const { listProperties } = await importProperties();
      setNextResult([]);
      setNextResult([{ count: 0 }]);

      await listProperties({
        location: 'Miami',
        minPrice: 100000,
        maxPrice: 500000,
        type: 'Any Type',
        beds: 2,
        baths: 1,
        page: 2,
        pageSize: 8,
      });

      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      const selectCall = mainCalls[0]!;
      expect(selectCall.text).toContain('unaccent(location) ILIKE');
      expect(selectCall.text).toContain('unaccent(title) ILIKE');
      expect(selectCall.text).toContain('price >=');
      expect(selectCall.text).toContain('price <=');
      expect(selectCall.text).toContain('beds >=');
      expect(selectCall.text).toContain('baths >=');
    });

    it('includeInactive=true does not restrict to is_active = true', async () => {
      const { listProperties } = await importProperties();
      setNextResult([]);
      setNextResult([{ count: 0 }]);

      await listProperties({
        page: 1,
        pageSize: 5,
        includeInactive: true,
      });

      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      const selectCall = mainCalls[0]!;
      expect(selectCall.text).not.toContain('is_active = true');
    });
  });

  describe('getPropertyBySlug (R4)', () => {
    it('returns a property when a row exists', async () => {
      const { getPropertyBySlug } = await importProperties();
      setNextResult([makeRow({ id: 'p1', slug: 'modern-villa' })]);

      const result = await getPropertyBySlug('modern-villa');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('p1');
      expect(result?.slug).toBe('modern-villa');
      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls[0]!.text).toContain('WHERE slug =');
      expect(mainCalls[0]!.text).toContain('LIMIT 1');
    });

    it('returns null when no row matches', async () => {
      const { getPropertyBySlug } = await importProperties();
      setNextResult([]);

      const result = await getPropertyBySlug('does-not-exist');

      expect(result).toBeNull();
    });
  });

  describe('countProperties (R5)', () => {
    it('returns a number from COUNT(*)', async () => {
      const { countProperties } = await importProperties();
      setNextResult([{ count: 42 }]);

      const result = await countProperties({});

      expect(result).toBe(42);
      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls[0]!.text).toContain('SELECT COUNT(*)::int AS count');
      expect(mainCalls[0]!.text).toContain('FROM properties');
    });
  });

  describe('insertProperty (R6)', () => {
    it('maps fields into a parameterized INSERT and returns the row', async () => {
      const { insertProperty } = await importProperties();
      setNextResult([makeRow({ id: 'p2', title: 'Inserted' })]);

      const result = await insertProperty({
        title: 'Inserted',
        description: null,
        price: 250000,
        type: 'sale',
        location: 'Madrid',
        lat: null,
        lng: null,
        beds: 3,
        baths: 2,
        parking: null,
        sqft: 1000,
        year_built: null,
        images: [],
        amenities: [],
        is_active: true,
        is_featured: false,
        is_new: true,
        slug: 'inserted',
      });

      expect(result.id).toBe('p2');
      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls[0]!.text).toContain('INSERT INTO properties');
      expect(mainCalls[0]!.text).toContain('RETURNING');
    });
  });

  describe('updateProperty (R6)', () => {
    it('throws when patch is empty', async () => {
      const { updateProperty } = await importProperties();
      await expect(
        updateProperty({ id: 'p1', patch: {} }),
      ).rejects.toThrowError(/at least one field/);
      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls).toHaveLength(0);
    });

    it('builds an UPDATE with only the provided patch fields', async () => {
      const { updateProperty } = await importProperties();
      setNextResult([makeRow({ id: 'p1', title: 'New title' })]);

      const result = await updateProperty({
        id: 'p1',
        patch: { title: 'New title', is_active: true },
      });

      expect(result.id).toBe('p1');
      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls[0]!.text).toContain('UPDATE properties');
      expect(mainCalls[0]!.text).toContain('SET');
      expect(mainCalls[0]!.text).toContain('WHERE id =');
      expect(mainCalls[0]!.text).toContain('RETURNING');
    });

    it('throws when no row was updated', async () => {
      const { updateProperty } = await importProperties();
      setNextResult([]);

      await expect(
        updateProperty({ id: 'missing', patch: { title: 'x' } }),
      ).rejects.toThrowError(/Property not found/);
    });
  });

  describe('togglePropertyActive (R7)', () => {
    it('flips is_active and revalidates nothing extra', async () => {
      const { togglePropertyActive } = await importProperties();
      setNextResult([{ id: 'p1' }]);

      await expect(togglePropertyActive('p1', true)).resolves.toBeUndefined();

      const mainCalls = sqlCalls.filter((c) => isMainQuery(c.text));
      expect(mainCalls[0]!.text).toContain('UPDATE properties');
      expect(mainCalls[0]!.text).toContain('SET is_active');
      expect(mainCalls[0]!.text).toContain('WHERE id =');
    });

    it('throws when target row does not exist', async () => {
      const { togglePropertyActive } = await importProperties();
      setNextResult([]);

      await expect(togglePropertyActive('missing', false)).rejects.toThrowError(
        /Property not found/,
      );
    });
  });
});

function makeRow(overrides: Partial<{
  id: string;
  title: string;
  slug: string | null;
}>): Record<string, unknown> {
  return {
    id: overrides.id ?? 'p1',
    title: overrides.title ?? 'Title',
    slug: overrides.slug ?? 'slug',
    description: null,
    price: 100000,
    type: 'sale',
    location: 'City',
    lat: null,
    lng: null,
    beds: 1,
    baths: 1,
    parking: null,
    sqft: 500,
    year_built: null,
    images: [],
    amenities: [],
    is_active: true,
    is_featured: false,
    is_new: true,
    created_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}
