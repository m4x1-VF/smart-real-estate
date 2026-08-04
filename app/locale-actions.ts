'use server';

import { cookies } from 'next/headers';

/**
 * Sets the NEXT_LOCALE cookie server-side with secure flags.
 * Called from LanguageSelector when the user changes locale.
 */
export async function setLocaleCookie(locale: string): Promise<void> {
  const validLocales = ['es', 'en', 'fr'];
  if (!validLocales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
