'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { GalleryDict } from '@/types/i18n';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  dict: GalleryDict;
  isFeatured?: boolean;
}

export default function PropertyGallery({
  images,
  title,
  dict,
  isFeatured = false,
}: PropertyGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  if (!images || images.length === 0) return null;

  const viewAllLabel = dict.view_all_photos.replace(
    '{count}',
    String(images.length),
  );

  return (
    <div className="space-y-4">
      <div className="relative aspect-16/10 overflow-hidden rounded-xl shadow-sm group">
        <Image
          src={images[activeImage]}
          alt={`${title} - Main View`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {isFeatured && (
            <span className="bg-mosque text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              {dict.premium}
            </span>
          )}
        </div>
        <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-nordic px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur transition-all flex items-center gap-2">
          <span className="material-icons text-sm">grid_view</span>
          {viewAllLabel}
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setActiveImage(idx)}
              className={`flex-none rounded-lg transition-all ${
                activeImage === idx
                  ? 'p-1 bg-mosque'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className="relative w-48 aspect-4/3 rounded-lg overflow-hidden cursor-pointer snap-start">
                <Image
                  src={img}
                  alt={`${title} - Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
