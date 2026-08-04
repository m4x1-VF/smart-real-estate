import { cache } from 'react';
import { getDb } from '@/lib/db/client';

/**
 * Checks if a user has admin role. Uses React cache() to deduplicate
 * within a single request lifecycle (layout + page share one DB call).
 */
export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  const sql = getDb();
  const result = await sql<{ one: number }[]>`
    SELECT 1 AS one
    FROM user_roles
    WHERE user_id = ${userId}
      AND role = 'admin'
    LIMIT 1
  `;
  return result.length > 0;
});
