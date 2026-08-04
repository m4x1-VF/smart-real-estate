'use server';

import { revalidatePath } from 'next/cache';
import {
  insertProperty,
  updateProperty,
  togglePropertyActive,
} from '@/lib/db/properties';
import type { NewPropertyInput, PropertyType } from '@/types/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { isAdmin } from '@/lib/db/admin';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (value === null) return undefined;
  return typeof value === 'string' ? value : undefined;
}

function getFormNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const value = getFormString(formData, key);
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getFormBoolean(formData: FormData, key: string): boolean {
  const value = getFormString(formData, key);
  return value === 'true' || value === 'on';
}

function getFormStringArray(formData: FormData, key: string): string[] {
  const value = formData.get(key);
  if (value === null) return [];
  if (typeof value !== 'string') return [];
  if (value === '') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return value.split(',').map((v) => v.trim()).filter((v) => v !== '');
  }
}

function buildPayload(
  formData: FormData,
): Omit<NewPropertyInput, 'slug' | 'images'> {
  const title = getFormString(formData, 'title') ?? '';
  const descriptionValue = getFormString(formData, 'description');
  const description = descriptionValue === '' ? null : (descriptionValue ?? null);
  const price = getFormNumber(formData, 'price') ?? 0;
  const type = (getFormString(formData, 'type') as PropertyType) ?? 'sale';
  const location = getFormString(formData, 'location') ?? '';
  const lat = getFormNumber(formData, 'lat');
  const lng = getFormNumber(formData, 'lng');
  const beds = getFormNumber(formData, 'beds') ?? 0;
  const baths = getFormNumber(formData, 'baths') ?? 0;
  const parking = getFormNumber(formData, 'parking');
  const sqft = getFormNumber(formData, 'sqft') ?? 0;
  const yearBuilt = getFormNumber(formData, 'year_built');
  const amenities = getFormStringArray(formData, 'amenities');
  const isFeatured = getFormBoolean(formData, 'is_featured');
  const isActiveRaw = formData.get('is_active');
  const isActive =
    isActiveRaw === null
      ? true
      : getFormBoolean(formData, 'is_active');

  return {
    title,
    description,
    price,
    type,
    location,
    lat: lat ?? null,
    lng: lng ?? null,
    beds,
    baths,
    parking: parking ?? null,
    sqft,
    year_built: yearBuilt ?? null,
    amenities,
    is_featured: isFeatured,
    is_active: isActive,
    is_new: true,
  } as Omit<NewPropertyInput, 'slug' | 'images'>;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  const admin = await isAdmin(session.user.id);
  if (!admin) throw new Error('Not authorized');
}

export async function saveProperty(formData: FormData): Promise<void> {
  await requireAdmin();

  try {
    const id = getFormString(formData, 'id');
    const existingImages = getFormStringArray(formData, 'images');
    const slugValue = getFormString(formData, 'slug');
    const basePayload = buildPayload(formData);
    const title = basePayload.title;

    const slug =
      slugValue && slugValue !== ''
        ? slugValue
        : title
          ? generateSlug(title)
          : null;

    const payload: NewPropertyInput = {
      ...basePayload,
      images: existingImages,
      slug,
    };

    if (id && id !== '') {
      await updateProperty({ id, patch: payload });
    } else {
      await insertProperty(payload);
    }

    revalidatePath('/admin/properties');
  } catch (err) {
    console.error('Failed to save property:', err);
    throw new Error('Failed to save property.');
  }
}

export async function togglePropertyActiveAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  try {
    const id = getFormString(formData, 'id');
    const current = getFormBoolean(formData, 'is_active');
    if (!id) throw new Error('Property id is required.');

    await togglePropertyActive(id, current);
    revalidatePath('/admin/properties');
  } catch (err) {
    console.error('Failed to toggle property active state:', err);
    throw new Error('Failed to toggle property active state.');
  }
}

export async function uploadImage(
  formData: FormData,
): Promise<{ url: string }> {
  await requireAdmin();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    throw new Error('No file provided.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error('Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 5MB.');
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImageToCloudinary(buffer, file.type);
    return { url };
  } catch (err) {
    console.error('Failed to upload image to Cloudinary:', err);
    throw new Error('Failed to upload image to Cloudinary.');
  }
}
