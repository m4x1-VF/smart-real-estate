'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FiltersDict, CommonDict } from '@/types/i18n';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dict: FiltersDict;
  commonDict: CommonDict;
  totalResults?: number;
}

const AMENITY_ICONS: Record<string, string> = {
  pool: 'pool',
  gym: 'fitness_center',
  parking: 'local_parking',
  ac: 'ac_unit',
  wifi: 'wifi',
  patio: 'deck',
};

const AMENITY_KEYS = Object.keys(AMENITY_ICONS);

export default function FilterModal({
  isOpen,
  onClose,
  dict,
  commonDict,
  totalResults = 0,
}: FilterModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [propertyType, setPropertyType] = useState('Any Type');
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocation(searchParams.get('location') || '');
      setMinPrice(searchParams.get('minPrice') || '');
      setMaxPrice(searchParams.get('maxPrice') || '');
      setPropertyType(searchParams.get('type') || 'Any Type');
      setBeds(parseInt(searchParams.get('beds') || '0', 10));
      setBaths(parseInt(searchParams.get('baths') || '0', 10));
      const amenitiesParam = searchParams.get('amenities');
      setAmenities(amenitiesParam ? amenitiesParam.split(',') : []);
    }
  }, [isOpen, searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (propertyType && propertyType !== 'Any Type')
      params.set('type', propertyType);
    if (beds > 0) params.set('beds', beds.toString());
    if (baths > 0) params.set('baths', baths.toString());
    if (amenities.length > 0) params.set('amenities', amenities.join(','));

    params.delete('page');

    router.push(`/?${params.toString()}`);
    onClose();
  };

  const handleClear = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('Any Type');
    setBeds(0);
    setBaths(0);
    setAmenities([]);
    router.push('/');
    onClose();
  };

  const toggleAmenity = (id: string) => {
    setAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const amenityLabels = dict.amenities as Record<string, string>;

  const propertyTypeOptions = [
    { value: 'Any Type', label: commonDict.any_type },
    { value: 'House', label: commonDict.property_types.house },
    { value: 'Apartment', label: commonDict.property_types.apartment },
    { value: 'Condo', label: commonDict.property_types.condo },
    { value: 'Townhouse', label: commonDict.property_types.townhouse },
    { value: 'Villa', label: commonDict.property_types.villa },
    { value: 'Penthouse', label: commonDict.property_types.penthouse },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-mosque/40 backdrop-blur-sm z-100 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="fixed inset-0 z-110 flex items-center justify-center p-4 pointer-events-none">
        <main className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
          <header className="px-8 py-6 border-b border-nordic/10 flex justify-between items-center bg-white sticky top-0 z-30">
            <h1 className="text-2xl font-semibold tracking-tight text-nordic">
              {dict.title}
            </h1>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-nordic/5 transition-colors text-nordic-muted"
            >
              <span className="material-icons font-material-icons">close</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto hide-scroll p-8 space-y-10">
            <section>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-3">
                {dict.location}
              </label>
              <div className="relative group">
                <span className="material-icons font-material-icons absolute left-4 top-3.5 text-nordic-muted group-focus-within:text-mosque transition-colors">
                  location_on
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-nordic/10 rounded-lg text-nordic placeholder-nordic-muted/50 focus:ring-2 focus:ring-mosque focus:border-mosque transition-all shadow-sm"
                  placeholder={dict.location_placeholder}
                />
              </div>
            </section>

            <section>
              <div className="flex justify-between items-end mb-4">
                <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider">
                  {dict.price_range}
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-nordic/10 p-3 rounded-lg focus-within:border-mosque/50 focus-within:ring-1 focus-within:ring-mosque/50 transition-colors">
                  <label className="block text-[10px] text-nordic-muted uppercase font-medium mb-1">
                    {dict.min_price}
                  </label>
                  <div className="flex items-center">
                    <span className="text-nordic-muted mr-1">€</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-transparent border-0 p-0 text-nordic font-medium focus:ring-0 text-sm placeholder:text-nordic-muted/40"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bg-white border border-nordic/10 p-3 rounded-lg focus-within:border-mosque/50 focus-within:ring-1 focus-within:ring-mosque/50 transition-colors">
                  <label className="block text-[10px] text-nordic-muted uppercase font-medium mb-1">
                    {dict.max_price}
                  </label>
                  <div className="flex items-center">
                    <span className="text-nordic-muted mr-1">€</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-transparent border-0 p-0 text-nordic font-medium focus:ring-0 text-sm placeholder:text-nordic-muted/40"
                      placeholder={commonDict.any}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider">
                  {dict.property_type}
                </label>
                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-white border border-nordic/10 rounded-lg py-3 pl-4 pr-10 text-nordic appearance-none focus:ring-2 focus:ring-mosque focus:border-mosque cursor-pointer"
                  >
                    {propertyTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-icons font-material-icons absolute right-3 top-3 text-nordic-muted pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-nordic">
                    {dict.bedrooms}
                  </span>
                  <div className="flex items-center space-x-3 bg-white border border-nordic/10 rounded-full p-1">
                    <button
                      onClick={() => setBeds(Math.max(0, beds - 1))}
                      className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-nordic-muted hover:text-mosque disabled:opacity-50 transition-colors"
                    >
                      <span className="material-icons font-material-icons text-base">
                        remove
                      </span>
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">
                      {beds > 0 ? `${beds}+` : commonDict.any}
                    </span>
                    <button
                      onClick={() => setBeds(beds + 1)}
                      className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-mosque hover:bg-mosque hover:text-white transition-colors"
                    >
                      <span className="material-icons font-material-icons text-base">
                        add
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-nordic">
                    {dict.bathrooms}
                  </span>
                  <div className="flex items-center space-x-3 bg-white border border-nordic/10 rounded-full p-1">
                    <button
                      onClick={() => setBaths(Math.max(0, baths - 1))}
                      className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-nordic-muted hover:text-mosque disabled:opacity-50 transition-colors"
                    >
                      <span className="material-icons font-material-icons text-base">
                        remove
                      </span>
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">
                      {baths > 0 ? `${baths}+` : commonDict.any}
                    </span>
                    <button
                      onClick={() => setBaths(baths + 1)}
                      className="w-8 h-8 rounded-full bg-white shadow-soft flex items-center justify-center text-mosque hover:bg-mosque hover:text-white transition-colors"
                    >
                      <span className="material-icons font-material-icons text-base">
                        add
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <label className="block text-xs font-semibold text-nordic-muted uppercase tracking-wider mb-4">
                {dict.amenities_title}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITY_KEYS.map((key) => {
                  const isActive = amenities.includes(key);
                  return (
                    <label
                      key={key}
                      className="cursor-pointer group relative"
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isActive}
                        onChange={() => toggleAmenity(key)}
                      />
                      <div
                        className={`h-full px-4 py-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${
                          isActive
                            ? 'border-mosque bg-mosque/5 text-mosque font-medium hover:bg-mosque/10'
                            : 'border-nordic/10 bg-white text-nordic-muted hover:border-nordic/30 hover:bg-black/5'
                        }`}
                      >
                        <span
                          className={`material-icons font-material-icons text-lg ${isActive ? '' : 'text-nordic-muted group-hover:text-nordic'}`}
                        >
                          {AMENITY_ICONS[key]}
                        </span>
                        <span>{amenityLabels[key]}</span>
                      </div>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-mosque rounded-full opacity-100 transition-opacity"></div>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          <footer className="bg-white border-t border-nordic/10 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between">
            <button
              onClick={handleClear}
              className="text-sm font-medium text-nordic-muted hover:text-nordic transition-colors underline decoration-nordic/20 underline-offset-4"
            >
              {dict.clear_all}
            </button>
            <button
              onClick={handleApply}
              className="bg-mosque hover:bg-mosque/90 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-mosque/30 transition-all hover:shadow-mosque/40 flex items-center gap-2 transform active:scale-95"
            >
              {totalResults > 0
                ? `${dict.show_count_homes} ${totalResults}`
                : dict.show_homes}
              <span className="material-icons font-material-icons text-sm">
                arrow_forward
              </span>
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
