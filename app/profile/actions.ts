'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '@/lib/auth/profile-schemas';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error('Not authenticated');
  return session;
}

/**
 * Updates the authenticated user's name.
 */
export async function updateProfile(
  formData: FormData,
): Promise<{ success: true }> {
  await requireSession();

  const nameValue = formData.get('name');
  const name = typeof nameValue === 'string' ? nameValue : '';

  const parsed = updateProfileSchema.parse({ name });

  await auth.api.updateUser({
    headers: await headers(),
    body: { name: parsed.name },
  });

  revalidatePath('/profile');
  return { success: true };
}

/**
 * Changes the authenticated user's password.
 * Verifies the current password before applying the change.
 */
export async function changePassword(
  formData: FormData,
): Promise<{ success: true }> {
  await requireSession();

  const currentPasswordValue = formData.get('currentPassword');
  const newPasswordValue = formData.get('newPassword');
  const confirmPasswordValue = formData.get('confirmPassword');

  const currentPassword =
    typeof currentPasswordValue === 'string' ? currentPasswordValue : '';
  const newPassword =
    typeof newPasswordValue === 'string' ? newPasswordValue : '';
  const confirmPassword =
    typeof confirmPasswordValue === 'string' ? confirmPasswordValue : '';

  const parsed = changePasswordSchema.parse({
    currentPassword,
    newPassword,
    confirmPassword,
  });

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
        revokeOtherSessions: false,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('current password')) {
      throw new Error('Current password is incorrect');
    }
    throw err;
  }

  return { success: true };
}

/**
 * Uploads an avatar to Cloudinary and updates the user's image field.
 */
export async function uploadAvatar(
  formData: FormData,
): Promise<{ url: string }> {
  await requireSession();

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    throw new Error('No file provided.');
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error('Invalid file type. Accepted: JPEG, PNG, WEBP, GIF.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 2MB.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let secureUrl: string;
  try {
    secureUrl = await uploadImageToCloudinary(buffer, file.type, {
      folder: 'luxu-estate/avatars/',
    });
  } catch (err) {
    console.error('Failed to upload avatar to Cloudinary:', err);
    throw new Error('Failed to upload avatar.');
  }

  await auth.api.updateUser({
    headers: await headers(),
    body: { image: secureUrl },
  });

  revalidatePath('/profile');
  return { url: secureUrl };
}
