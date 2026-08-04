'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';
import { isAdmin } from '@/lib/db/admin';

export async function toggleUserRole(userId: string, currentRole: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error('Not authenticated');

  // Verify admin status via efficient query
  const admin = await isAdmin(session.user.id);
  if (!admin) {
    throw new Error('Not authorized');
  }

  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  const sql = getDb();
  const result = await sql`
    UPDATE user_roles SET role = ${newRole}::public.app_role WHERE user_id = ${userId} RETURNING id
  `;

  if (!result || (result as unknown[]).length === 0) {
    throw new Error('Failed to update role');
  }

  revalidatePath('/admin/users');
}
