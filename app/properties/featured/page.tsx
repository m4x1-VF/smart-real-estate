import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/ui/PropertyCard';
import Pagination from '@/components/Pagination';
import { listProperties } from '@/lib/db/properties';
import { cookies, headers } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { auth } from '@/lib/auth';
import { getFavoritePropertyIds } from '@/app/saved/actions';

const PAGE_SIZE = 12;

interface FeaturedPropertiesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function FeaturedPropertiesPage({ searchParams }: FeaturedPropertiesPageProps) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  const dict = getDictionary(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  let favoriteIds: Set<string> | undefined;
  if (session) {
    const ids = await getFavoritePropertyIds(session.user.id);
    favoriteIds = new Set(ids);
  }

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));

  const { properties, totalCount } = await listProperties({
    page: currentPage,
    pageSize: PAGE_SIZE,
    featured: true,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-nordic">
            {dict.common.featured_properties}
          </h1>
          <p className="text-nordic-muted mt-1 text-sm">
            {dict.featured.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited={favoriteIds?.has(property.id) ?? false}
              dict={dict.common}
            />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/properties/featured"
        />
      </main>
      <Footer />
    </>
  );
}
