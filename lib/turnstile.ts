import 'server-only';

/**
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * POSTs to https://challenges.cloudflare.com/turnstile/v0/siteverify
 * with the secret key and the user-response token.
 *
 * @returns `true` if verification succeeded, `false` otherwise.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // No secret configured — fail open with a warning (development only).
    console.warn(
      '[Turnstile] TURNSTILE_SECRET_KEY is not set; skipping verification.'
    );
    return true;
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `[Turnstile] Siteverify HTTP error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    // Network error or unexpected failure — log and deny.
    console.error('[Turnstile] Verification request failed:', error);
    return false;
  }
}
