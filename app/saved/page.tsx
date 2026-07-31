import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import PropertyCard from '@/components/ui/PropertyCard';
import Footer from '@/components/Footer';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { listFavoriteProperties } from '@/app/saved/actions';

export default async function SavedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const cookieStore = await cookies();
  const locale = cookieStore?.get('NEXT_LOCALE')?.value || 'es';
  const dict = getDictionary(locale);

  const properties = await listFavoriteProperties(session.user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <h1 className="text-3xl font-bold text-nordic mb-8">{dict.common.saved_title}</h1>
        {properties.length === 0 ? (
          <p className="text-nordic-muted">{dict.common.saved_empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} isFavorited={true} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
