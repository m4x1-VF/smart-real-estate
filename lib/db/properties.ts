import type {
  Property,
  PropertyType,
  NewPropertyInput,
  UpdatePropertyInput,
} from '@/types/db';
import { getDb } from '@/lib/db/client';

export interface ListPropertiesFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  beds?: number;
  baths?: number;
  page: number;
  pageSize: number;
  includeInactive?: boolean;
}

export interface ListPropertiesResult {
  properties: Property[];
  totalCount: number;
}

export type PropertyRow = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  price: string | number;
  type: PropertyType;
  location: string;
  lat: string | number | null;
  lng: string | number | null;
  beds: number;
  baths: number;
  parking: number | null;
  sqft: number;
  year_built: number | null;
  images: string[];
  amenities: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: Date | string;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : Number(value);
}

function toDateIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function mapRow(row: PropertyRow): Property {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: toNumber(row.price) ?? 0,
    type: row.type,
    location: row.location,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    beds: row.beds,
    baths: row.baths,
    parking: row.parking,
    sqft: row.sqft,
    year_built: row.year_built,
    images: row.images ?? [],
    amenities: row.amenities ?? [],
    is_active: row.is_active,
    is_featured: row.is_featured,
    is_new: row.is_new,
    created_at: toDateIso(row.created_at),
  };
}

export const PROPERTY_COLUMNS =
  'id, title, slug, description, price, type, location, lat, lng, ' +
  'beds, baths, parking, sqft, year_built, images, amenities, ' +
  'is_active, is_featured, is_new, created_at';

export async function listProperties(
  filters: ListPropertiesFilters,
): Promise<ListPropertiesResult> {
  const sql = getDb();
  const {
    location,
    minPrice,
    maxPrice,
    type,
    beds,
    baths,
    page,
    pageSize,
    includeInactive = false,
  } = filters;

  const pageSize_ = Math.max(1, pageSize);
  const offset = Math.max(0, (page - 1) * pageSize_);

  const rows = (await sql<PropertyRow[]>`
    SELECT ${sql.unsafe(PROPERTY_COLUMNS)}
    FROM properties
    WHERE ${includeInactive ? sql.unsafe('true') : sql`is_active = true`}
      ${location && location !== '' ? sql`AND (location ILIKE ${'%' + location + '%'} OR title ILIKE ${'%' + location + '%'})` : sql``}
      ${minPrice !== undefined ? sql`AND price >= ${minPrice}` : sql``}
      ${maxPrice !== undefined ? sql`AND price <= ${maxPrice}` : sql``}
      ${type && type !== 'Any Type' ? sql`AND title ILIKE ${'%' + type + '%'}` : sql``}
      ${beds !== undefined ? sql`AND beds >= ${beds}` : sql``}
      ${baths !== undefined ? sql`AND baths >= ${baths}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${pageSize_}
    OFFSET ${offset}
  `) as PropertyRow[];

  const totalCount = await countProperties({
    location,
    minPrice,
    maxPrice,
    type,
    beds,
    baths,
    includeInactive,
  });

  return {
    properties: rows.map(mapRow),
    totalCount,
  };
}

export async function countProperties(
  filters: Omit<ListPropertiesFilters, 'page' | 'pageSize'>,
): Promise<number> {
  const sql = getDb();
  const {
    location,
    minPrice,
    maxPrice,
    type,
    beds,
    baths,
    includeInactive = false,
  } = filters;

  const rows = (await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM properties
    WHERE ${includeInactive ? sql.unsafe('true') : sql`is_active = true`}
      ${location && location !== '' ? sql`AND (location ILIKE ${'%' + location + '%'} OR title ILIKE ${'%' + location + '%'})` : sql``}
      ${minPrice !== undefined ? sql`AND price >= ${minPrice}` : sql``}
      ${maxPrice !== undefined ? sql`AND price <= ${maxPrice}` : sql``}
      ${type && type !== 'Any Type' ? sql`AND title ILIKE ${'%' + type + '%'}` : sql``}
      ${beds !== undefined ? sql`AND beds >= ${beds}` : sql``}
      ${baths !== undefined ? sql`AND baths >= ${baths}` : sql``}
  `) as { count: number }[];

  return rows[0]?.count ?? 0;
}

export async function getPropertyBySlug(
  slug: string,
): Promise<Property | null> {
  const sql = getDb();
  const rows = (await sql<PropertyRow[]>`
    SELECT ${sql.unsafe(PROPERTY_COLUMNS)}
    FROM properties
    WHERE slug = ${slug}
    LIMIT 1
  `) as PropertyRow[];

  if (rows.length === 0) return null;
  return mapRow(rows[0]);
}

export async function insertProperty(
  input: NewPropertyInput,
): Promise<Property> {
  const sql = getDb();
  const payload = {
    title: input.title,
    description: input.description ?? null,
    price: input.price,
    type: input.type,
    location: input.location,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    beds: input.beds,
    baths: input.baths,
    parking: input.parking ?? null,
    sqft: input.sqft,
    year_built: input.year_built ?? null,
    images: sql.array(input.images ?? []),
    amenities: sql.array(input.amenities ?? []),
    is_active: input.is_active,
    is_featured: input.is_featured,
    is_new: input.is_new,
    slug: input.slug ?? null,
  };

  const rows = (await sql<PropertyRow[]>`
    INSERT INTO properties ${sql(payload)}
    RETURNING ${sql.unsafe(PROPERTY_COLUMNS)}
  `) as PropertyRow[];

  return mapRow(rows[0]);
}

export async function updateProperty(
  input: UpdatePropertyInput,
): Promise<Property> {
  const sql = getDb();
  const patch = input.patch;
  const payload: Record<string, unknown> = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.price !== undefined) payload.price = patch.price;
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.location !== undefined) payload.location = patch.location;
  if (patch.lat !== undefined) payload.lat = patch.lat;
  if (patch.lng !== undefined) payload.lng = patch.lng;
  if (patch.beds !== undefined) payload.beds = patch.beds;
  if (patch.baths !== undefined) payload.baths = patch.baths;
  if (patch.parking !== undefined) payload.parking = patch.parking;
  if (patch.sqft !== undefined) payload.sqft = patch.sqft;
  if (patch.year_built !== undefined) payload.year_built = patch.year_built;
  if (patch.images !== undefined) payload.images = sql.array(patch.images);
  if (patch.amenities !== undefined)
    payload.amenities = sql.array(patch.amenities);
  if (patch.is_active !== undefined) payload.is_active = patch.is_active;
  if (patch.is_featured !== undefined) payload.is_featured = patch.is_featured;
  if (patch.is_new !== undefined) payload.is_new = patch.is_new;
  if (patch.slug !== undefined) payload.slug = patch.slug;

  if (Object.keys(payload).length === 0) {
    throw new Error('updateProperty: patch must contain at least one field');
  }

  const rows = (await sql<PropertyRow[]>`
    UPDATE properties SET ${sql(payload)}
    WHERE id = ${input.id}
    RETURNING ${sql.unsafe(PROPERTY_COLUMNS)}
  `) as PropertyRow[];

  if (rows.length === 0) {
    throw new Error(`Property not found: ${input.id}`);
  }
  return mapRow(rows[0]);
}

export async function togglePropertyActive(
  id: string,
  current: boolean,
): Promise<void> {
  const sql = getDb();
  const result = (await sql<{ id: string }[]>`
    UPDATE properties
    SET is_active = ${!current}
    WHERE id = ${id}
    RETURNING id
  `) as { id: string }[];

  if (result.length === 0) {
    throw new Error(`Property not found: ${id}`);
  }
}
