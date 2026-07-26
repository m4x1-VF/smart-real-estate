'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';

export async function toggleUserRole(userId: string, currentRole: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error('Not authenticated');

  // Verify admin status against Neon
  const sql = getDb();
  const admins = await sql<
    { email: string }[]
  >`SELECT u.email FROM user_roles ur JOIN public."user" u ON u.id = ur.user_id WHERE ur.role = 'admin'`;
  const isAdmin = admins.some((a) => a.email === session.user.email);

  if (!isAdmin) {
    throw new Error('Not authorized');
  }

  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  const result = await sql`
    UPDATE user_roles SET role = ${newRole}::public.app_role WHERE user_id = ${userId} RETURNING id
  `;

  if (!result || (result as unknown[]).length === 0) {
    throw new Error('Failed to update role');
  }

  revalidatePath('/admin/users');
}
