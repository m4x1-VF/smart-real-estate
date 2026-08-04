import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';

export default async function AdminForbidden() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  const t = getDictionary(locale).dashboard;

  return (
    <div className="bg-clear-day text-nordic font-display min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          {t.layout.forbidden_title}
        </h1>
        <p className="text-nordic-muted">
          {t.layout.forbidden_message}
        </p>
      </div>
    </div>
  );
}
