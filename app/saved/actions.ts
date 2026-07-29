'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  getFavoritePropertyIds as dbGetFavoritePropertyIds,
  listFavoriteProperties as dbListFavoriteProperties,
} from '@/lib/db/favorites';
import { toggleFavoriteSchema } from '@/lib/favorites/schemas';
import type { Property } from '@/types/db';

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error('Not authenticated');
  return session;
}

/**
 * Toggles a property's favorite status for the authenticated user.
 * Returns the new favorite state.
 */
export async function toggleFavorite(
  propertyId: string,
): Promise<{ isFavorited: boolean }> {
  const session = await requireSession();

  const parsed = toggleFavoriteSchema.safeParse({ propertyId });
  if (!parsed.success) {
    throw new Error('Invalid property id');
  }

  const userId = session.user.id;
  const pid = parsed.data.propertyId;

  const current = await isFavorite(userId, pid);

  if (current) {
    await removeFavorite(userId, pid);
  } else {
    await addFavorite(userId, pid);
  }

  revalidatePath('/saved');

  return { isFavorited: !current };
}

/**
 * Returns the property IDs marked as favorites by the given user.
 */
export async function getFavoritePropertyIds(
  userId: string,
): Promise<string[]> {
  return dbGetFavoritePropertyIds(userId);
}

/**
 * Returns complete Property objects for all favorites of the given user.
 */
export async function listFavoriteProperties(
  userId: string,
): Promise<Property[]> {
  return dbListFavoriteProperties(userId);
}
