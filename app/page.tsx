import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeaturedCollection from '@/components/FeaturedCollection';
import NewInMarket from '@/components/NewInMarket';
import { listProperties } from '@/lib/db/properties';
import { cookies, headers } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { auth } from '@/lib/auth';
import { getFavoritePropertyIds } from '@/app/saved/actions';

const PAGE_SIZE = 8;

interface HomePageProps {
  searchParams: Promise<{
    page?: string;
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    type?: string;
    beds?: string;
    baths?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es';
  const dict = getDictionary(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  let favoriteIds: Set<string> | undefined;
  if (session) {
    const ids = await getFavoritePropertyIds(session.user.id);
    favoriteIds = new Set(ids);
  }

  const { page, location, minPrice, maxPrice, type, beds, baths } =
    await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? '1', 10));

  const minPriceNumber = minPrice ? parseInt(minPrice, 10) : undefined;
  const maxPriceNumber = maxPrice ? parseInt(maxPrice, 10) : undefined;
  const bedsNumber = beds ? parseInt(beds, 10) : undefined;
  const bathsNumber = baths ? parseInt(baths, 10) : undefined;

  const { properties, totalCount } = await listProperties({
    location: location && location !== '' ? location : undefined,
    minPrice: minPriceNumber,
    maxPrice: maxPriceNumber,
    type: type && type !== '' ? type : undefined,
    beds: bedsNumber,
    baths: bathsNumber,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const isFilterActive = !!(
    location ||
    minPrice ||
    maxPrice ||
    type ||
    beds ||
    baths
  );

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Hero dict={dict.hero} />
        {!isFilterActive && <FeaturedCollection dict={dict.common} />}
        <NewInMarket
          dict={dict.common}
          properties={properties}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          favoriteIds={favoriteIds}
        />
      </main>
    </>
  );
}
