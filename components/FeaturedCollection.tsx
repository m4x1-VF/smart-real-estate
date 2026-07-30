import Link from 'next/link';
import { Collection } from '@/data/mockData';
import CollectionCard from './ui/CollectionCard';
import { getDb } from '@/lib/db/client';
import type { CommonDict, FeaturedDict } from '@/types/i18n';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getFavoritePropertyIds } from '@/app/saved/actions';

interface FeaturedCollectionProps {
  dict: CommonDict;
  featuredDict: FeaturedDict;
}

const FeaturedCollection = async ({ dict, featuredDict }: FeaturedCollectionProps) => {
  const sql = getDb();

  const properties = await sql<
    {
      id: string;
      title: string;
      slug: string | null;
      location: string;
      price: string | number;
      images: string[];
      beds: number;
      baths: number;
      sqft: number;
      is_new: boolean;
    }[]
  >`SELECT id, title, slug, location, price, images, beds, baths, sqft, is_new FROM properties WHERE is_featured = true AND is_active = true LIMIT 2`;

  const collections: Collection[] = (properties || []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug || undefined,
    location: p.location,
    price: typeof p.price === 'string' ? Number(p.price) : p.price,
    images: p.images || [],
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    tag: p.is_new ? featuredDict.new_arrival : featuredDict.exclusive,
  }));

  const session = await auth.api.getSession({ headers: await headers() });
  let favoriteIds: Set<string> | undefined;
  if (session) {
    const ids = await getFavoritePropertyIds(session.user.id);
    favoriteIds = new Set(ids);
  }

  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl font-light text-nordic">
            {dict.featured_properties}
          </h2>
          <p className="text-nordic-muted mt-1 text-sm">
            {featuredDict.subtitle}
          </p>
        </div>
        <Link
          href="#"
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque hover:opacity-70 transition-opacity"
        >
          {featuredDict.view_all}{' '}
          <span className="material-icons text-sm font-material-icons">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            isFavorited={favoriteIds?.has(collection.id) ?? false}
            dict={dict}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedCollection;
