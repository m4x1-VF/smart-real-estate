import { getDb } from '@/lib/db/client';
import type { Property } from '@/types/db';
import { mapRow, type PropertyRow } from '@/lib/db/properties';

/**
 * Adds a property to the user's favorites.
 * Idempotent: uses ON CONFLICT DO NOTHING to avoid duplicates.
 */
export async function addFavorite(
  userId: string,
  propertyId: string,
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO favorites (user_id, property_id)
    VALUES (${userId}, ${propertyId})
    ON CONFLICT (user_id, property_id) DO NOTHING
  `;
}

/**
 * Removes a property from the user's favorites.
 */
export async function removeFavorite(
  userId: string,
  propertyId: string,
): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM favorites
    WHERE user_id = ${userId} AND property_id = ${propertyId}
  `;
}

/**
 * Checks if a property is in the user's favorites.
 */
export async function isFavorite(
  userId: string,
  propertyId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM favorites
      WHERE user_id = ${userId} AND property_id = ${propertyId}
    )
  `;
  return rows[0]?.exists ?? false;
}

/**
 * Returns the property IDs marked as favorites by the user.
 */
export async function getFavoritePropertyIds(
  userId: string,
): Promise<string[]> {
  const sql = getDb();
  const rows = await sql<{ property_id: string }[]>`
    SELECT property_id
    FROM favorites
    WHERE user_id = ${userId}
  `;
  return rows.map((r) => r.property_id);
}

/**
 * Returns complete Property objects for all favorites of the user,
 * ordered by property created_at descending.
 * Excludes inactive properties (is_active = false).
 */
export async function listFavoriteProperties(
  userId: string,
): Promise<Property[]> {
  const sql = getDb();
  const rows = (await sql<PropertyRow[]>`
    SELECT p.id, p.title, p.slug, p.description, p.price, p.type,
           p.location, p.lat, p.lng, p.beds, p.baths, p.parking,
           p.sqft, p.year_built, p.images, p.amenities,
           p.is_active, p.is_featured, p.is_new, p.created_at
    FROM favorites f
    JOIN properties p ON p.id = f.property_id
    WHERE f.user_id = ${userId} AND p.is_active = true
    ORDER BY p.created_at DESC
  `) as PropertyRow[];
  return rows.map(mapRow);
}
