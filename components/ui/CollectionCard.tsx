import Image from 'next/image';
import { Collection } from '@/data/mockData';
import Link from 'next/link';
import FavoriteButton from '@/components/ui/FavoriteButton';
import type { CommonDict } from '@/types/i18n';

interface CollectionCardProps {
  collection: Collection;
  isFavorited?: boolean;
  dict?: CommonDict;
}

const CollectionCard = ({ collection, isFavorited = false, dict }: CollectionCardProps) => {
  return (
    <Link
      href={`/properties/${collection.slug || collection.id}`}
      className="block group relative rounded-xl overflow-hidden shadow-soft bg-white cursor-pointer h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="aspect-4/3 w-full overflow-hidden relative bg-gray-100">
        {collection.images[0] ? (
          <Image
            src={collection.images[0]}
            alt={collection.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-6xl text-gray-300">home</span>
          </div>
        )}

        {/* Tag */}
        <div className="absolute top-4 left-4 bg-nordic/90 backdrop-blur-sm px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider text-white">
          {collection.tag}
        </div>

        {/* Favorite Button */}
        <FavoriteButton
          propertyId={collection.id}
          isFavorited={isFavorited}
          position="top-4 right-4"
          size="xl"
        />

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-linear-to-t from-black/60 to-transparent opacity-60"></div>
      </div>

      {/* Content */}
      <div className="p-6 relative flex flex-col grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-lg text-nordic">
            €{collection.price.toLocaleString()}
          </h3>
        </div>

        <h4 className="text-nordic font-medium truncate mb-1">
          {collection.title}
        </h4>
        <p className="text-nordic-muted text-sm flex items-center gap-1 mb-4">
          <span className="material-icons text-sm font-material-icons">
            place
          </span>{' '}
          {collection.location}
        </p>

        {/* Features */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-nordic/5">
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              king_bed
            </span>{' '}
            {collection.beds} {dict?.beds_label || 'Beds'}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              bathtub
            </span>{' '}
            {collection.baths} {dict?.baths_label || 'Baths'}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              square_foot
            </span>{' '}
            {collection.sqft.toLocaleString()} {dict?.sqm || 'm²'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;
