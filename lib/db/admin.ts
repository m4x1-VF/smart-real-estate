import { getDb } from '@/lib/db/client';

export async function isAdminUser(email: string): Promise<boolean> {
  const sql = getDb();
  const admins = await sql<
    { email: string }[]
  >`SELECT u.email FROM user_roles ur JOIN public."user" u ON u.id = ur.user_id WHERE ur.role = 'admin'`;
  return admins.some((a) => a.email === email);
}
