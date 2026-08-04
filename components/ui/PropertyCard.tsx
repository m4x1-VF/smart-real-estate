import Image from 'next/image';
import Link from 'next/link';
import type { Property } from '@/types/db';
import FavoriteButton from '@/components/ui/FavoriteButton';
import type { CommonDict } from '@/types/i18n';

interface PropertyCardProps {
  property: Property;
  isFavorited?: boolean;
  dict?: CommonDict;
}

const PropertyCard = ({ property, isFavorited = false, dict }: PropertyCardProps) => {
  const saleLabel = property.type === 'sale' ? 'VENTA' : 'ALQUILER';

  return (
    <Link
      href={`/properties/${property.slug || property.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer h-full flex flex-col"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-icons text-6xl text-gray-300">home</span>
          </div>
        )}

        <FavoriteButton
          propertyId={property.id}
          isFavorited={isFavorited}
          position="top-3 right-3"
          size="lg"
        />

        <div
          className={`absolute bottom-3 left-3 text-white text-xs font-bold px-2 py-1 rounded ${property.type === 'sale' ? 'bg-nordic/90' : 'bg-mosque/90'}`}
        >
          {saleLabel}
        </div>
      </div>

      <div className="p-4 flex flex-col grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-lg text-nordic">
            €{property.price.toLocaleString()}
            {property.type === 'rent' && (
              <span className="text-sm font-normal text-nordic-muted">/mes</span>
            )}
          </h3>
        </div>

        <h4 className="text-nordic font-medium truncate mb-1">
          {property.title}
        </h4>
        <p className="text-nordic-muted text-xs mb-4">{property.location}</p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              king_bed
            </span>{' '}
            {property.beds} {dict?.beds_label || 'Hab'}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              bathtub
            </span>{' '}
            {property.baths} {dict?.baths_label || 'Baños'}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80 font-material-icons">
              square_foot
            </span>{' '}
            {property.sqft} {dict?.sqm || 'm²'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
