'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Property } from '@/types/db';
import type { DashboardPropertyFormDict } from '@/types/i18n';
import { saveProperty, uploadImage } from '@/app/admin/properties/actions';
import Image from 'next/image';
import DynamicPropertyMap from '@/components/DynamicPropertyMap';

import { optimizeImage } from '@/lib/optimize-image';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

interface PropertyFormProps {
  initialData?: Property;
  t: DashboardPropertyFormDict;
}

export default function PropertyForm({ initialData, t }: PropertyFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Property>>({
    title: initialData?.title || '',
    price: initialData?.price || 0,
    type: initialData?.type || 'sale',
    location: initialData?.location || '',
    lat: initialData?.lat ?? undefined,
    lng: initialData?.lng ?? undefined,
    beds: initialData?.beds || 0,
    baths: initialData?.baths || 0,
    sqft: initialData?.sqft || 0,
    description: initialData?.description || '',
    year_built: initialData?.year_built || new Date().getFullYear(),
    parking: initialData?.parking || 0,
    amenities: initialData?.amenities || [],
    is_featured: initialData?.is_featured || false,
    is_active: initialData?.is_active ?? true,
    images: initialData?.images || [],
  });

  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(
    initialData?.images || [],
  );

  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(
    new Set(),
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { id, value, type } = e.target as HTMLInputElement;

    const optionalFields: Array<keyof Property> = ['lat', 'lng'];
    let parsedValue: string | number | boolean | undefined = value;

    if (type === 'number') {
      parsedValue =
        value === ''
          ? optionalFields.includes(id as keyof Property)
            ? undefined
            : 0
          : Number(value);
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [id]: parsedValue }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(amenity)) {
        return {
          ...prev,
          amenities: currentAmenities.filter((a) => a !== amenity),
        };
      } else {
        return {
          ...prev,
          amenities: [...currentAmenities, amenity],
        };
      }
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    // Reset input so the same file can be re-selected
    e.target.value = '';

    for (const file of filesArray) {
      // Client-side validation: MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(t.errors.invalid_file_type.replace('{name}', file.name));
        continue;
      }

      // Client-side validation: file size
      if (file.size > MAX_FILE_SIZE) {
        setError(t.errors.file_exceeds_size.replace('{name}', file.name));
        continue;
      }

      // Optimize image before upload
      let optimizedBlob: Blob;
      try {
        optimizedBlob = await optimizeImage(file);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t.errors.failed_to_optimize;
        setError(message);
        continue;
      }

      // Build optimized file with new name
      const basename = file.name.replace(/\.[^/.]+$/, ''); // remove extension
      const optimizedFile = new File([optimizedBlob], `${basename}-optimized.jpg`, {
        type: 'image/jpeg',
      });

      // Add placeholder (local preview) and track its index
      const placeholderUrl = URL.createObjectURL(optimizedBlob);
      const startIndex = imagePreviewUrls.length;

      setImagePreviewUrls((prev) => [...prev, placeholderUrl]);
      setUploadingIndices((prev) => new Set(prev).add(startIndex));

      try {
        const uploadFormData = new FormData();
        uploadFormData.set('file', optimizedFile);

        const result = await uploadImage(uploadFormData);

        // Replace placeholder URL with Cloudinary URL
        setImagePreviewUrls((prev) =>
          prev.map((url, i) => (i === startIndex ? result.url : url)),
        );

        // Add Cloudinary URL to formData.images
        setFormData((prev) => {
          const currentImages = [...(prev.images || [])];
          currentImages[startIndex] = result.url;
          return { ...prev, images: currentImages };
        });
      } catch (err) {
        // Remove placeholder on error — recalculate index based on current state
        setImagePreviewUrls((prev) => {
          const idx = prev.indexOf(placeholderUrl);
          if (idx === -1) return prev;
          setUploadingIndices((s) => {
            const next = new Set(s);
            next.delete(idx);
            return next;
          });
          return prev.filter((_, i) => i !== idx);
        });
        setFormData((prev) => {
          // Remove the image at the same relative position
          const images = prev.images || [];
          return { ...prev, images: images.filter((url) => url !== placeholderUrl) };
        });

        const message =
          err instanceof Error ? err.message : t.errors.failed_to_upload;
        setError(message);
      } finally {
        // Clean up uploading state — find by placeholder URL position
        setUploadingIndices((prev) => {
          const next = new Set(prev);
          next.delete(startIndex);
          return next;
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const incrementValue = (field: keyof Property) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (Number(prev[field]) || 0) + 1,
    }));
  };

  const decrementValue = (field: keyof Property) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, (Number(prev[field]) || 0) - 1),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formPayload = new FormData();

      if (isEditMode && initialData?.id) {
        formPayload.set('id', initialData.id);
      }
      if (initialData?.slug) {
        formPayload.set('slug', initialData.slug);
      }

      formPayload.set('title', formData.title ?? '');
      formPayload.set(
        'description',
        formData.description === undefined || formData.description === null
          ? ''
          : formData.description,
      );
      formPayload.set('price', String(formData.price ?? 0));
      formPayload.set('type', formData.type ?? 'sale');
      formPayload.set('location', formData.location ?? '');
      if (formData.lat !== undefined) formPayload.set('lat', String(formData.lat));
      if (formData.lng !== undefined) formPayload.set('lng', String(formData.lng));
      formPayload.set('beds', String(formData.beds ?? 0));
      formPayload.set('baths', String(formData.baths ?? 0));
      if (formData.parking !== undefined)
        formPayload.set('parking', String(formData.parking));
      formPayload.set('sqft', String(formData.sqft ?? 0));
      if (formData.year_built !== undefined)
        formPayload.set('year_built', String(formData.year_built));
      formPayload.set('amenities', JSON.stringify(formData.amenities ?? []));
      formPayload.set('is_featured', String(!!formData.is_featured));
      formPayload.set('is_active', String(!!formData.is_active));
      formPayload.set('images', JSON.stringify(formData.images ?? []));

      await saveProperty(formPayload);

      router.push('/admin/properties');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.failed_to_save;
      console.error('Error saving property:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const AMENITIES_LIST = [
    'Swimming Pool',
    'Garden',
    'Air Conditioning',
    'Smart Home',
    'Balcony',
    'Gym',
    'Security System',
    'Elevator',
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mb-24"
    >
      <div className="xl:col-span-8 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-of-green/30 flex items-center justify-between gap-3 bg-linear-to-r from-hint-of-green/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-hint-of-green flex items-center justify-center text-nordic">
                <span className="material-icons text-lg">info</span>
              </div>
              <h2 className="text-xl font-bold text-nordic">
                {t.basic_information}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm">
                <input
                  id="is_featured"
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-mosque border-gray-300 rounded focus:ring-mosque"
                />
                <span className="text-sm font-medium text-nordic transition-colors">
                  {t.featured}
                </span>
              </label>
              <label
                className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border shadow-sm transition-colors ${
                  formData.is_active
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-red-50 border-red-300 text-red-600'
                }`}
              >
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-sm font-medium">
                  {formData.is_active ? t.active : t.inactive}
                </span>
              </label>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="group">
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                htmlFor="title"
              >
                {t.property_title} <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full text-base px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sans"
                placeholder="e.g. Modern Penthouse with Ocean View"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                  htmlFor="price"
                >
                  {t.price} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-sans text-sm">
                    $
                  </span>
                  <input
                    id="price"
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-7 pr-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-medium font-sans"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                  htmlFor="type"
                >
                  {t.property_type}
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sans cursor-pointer"
                >
                  <option value="sale">{t.type_sale}</option>
                  <option value="rent">{t.type_rent}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-of-green/30 flex items-center gap-3 bg-linear-to-r from-hint-of-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-of-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">description</span>
            </div>
            <h2 className="text-xl font-bold text-nordic">{t.description_title}</h2>
          </div>
          <div className="p-8">
            <div className="mb-3 flex gap-2 border-b border-gray-100 pb-2">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
                title={t.format_bold}
              >
                <span className="material-icons text-lg">format_bold</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
                title={t.format_italic}
              >
                <span className="material-icons text-lg">format_italic</span>
              </button>
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-nordic hover:bg-gray-50 rounded transition-colors"
                title={t.format_list}
              >
                <span className="material-icons text-lg">
                  format_list_bulleted
                </span>
              </button>
            </div>
            <textarea
              id="description"
              value={formData.description ?? ''}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-base font-sans leading-relaxed resize-y min-h-[200px]"
              placeholder="Describe the property features, neighborhood, and unique selling points..."
            />
            <div className="mt-2 text-right text-xs text-gray-400 font-sans">
              {t.character_counter.replace('{count}', String((formData.description || '').length))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-hint-of-green/30 flex justify-between items-center bg-linear-to-r from-hint-of-green/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-hint-of-green flex items-center justify-center text-nordic">
                <span className="material-icons text-lg">image</span>
              </div>
              <h2 className="text-xl font-bold text-nordic">{t.gallery}</h2>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded font-sans">
              {t.file_formats}
            </span>
          </div>
          <div className="p-8">
            <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 p-10 text-center hover:bg-hint-of-green/10 hover:border-mosque/40 transition-colors cursor-pointer group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-mosque group-hover:scale-110 transition-transform duration-300">
                  <span className="material-icons text-2xl">cloud_upload</span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-nordic font-sans">
                    {t.drop_zone}
                  </p>
                  <p className="text-xs text-gray-400 font-sans">
                    {t.max_size}
                  </p>
                </div>
              </div>
            </div>

            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {imagePreviewUrls.map((url, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden relative group shadow-sm"
                  >
                    <Image
                      src={url}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {uploadingIndices.has(index) && (
                      <div className="absolute inset-0 bg-nordic/50 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-icons animate-spin text-white text-2xl">
                            refresh
                          </span>
                          <span className="text-white text-xs font-medium font-sans">
                            {t.uploading}
                          </span>
                        </div>
                      </div>
                    )}
                    {!uploadingIndices.has(index) && (
                      <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                      </div>
                    )}
                    {index === 0 && !uploadingIndices.has(index) && (
                      <span className="absolute top-2 left-2 bg-mosque text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm font-sans uppercase tracking-wider">
                        {t.main}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="xl:col-span-4 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-hint-of-green/30 flex items-center gap-3 bg-linear-to-r from-hint-of-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-of-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">place</span>
            </div>
            <h2 className="text-lg font-bold text-nordic">{t.location}</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                htmlFor="location"
              >
                {t.address} <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                type="text"
                required
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sans"
                placeholder="Street Address, City, Zip"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                  htmlFor="lat"
                >
                  {t.latitude}
                </label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sans"
                  placeholder="e.g. 40.7128"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-nordic mb-1.5 font-sans"
                  htmlFor="lng"
                >
                  {t.longitude}
                </label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng ?? ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-md border-gray-200 bg-white text-nordic placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque transition-all text-sm font-sans"
                  placeholder="e.g. -74.0060"
                />
              </div>
            </div>
            {typeof formData.lat === 'number' &&
            typeof formData.lng === 'number' ? (
              <div className="mt-4">
                <DynamicPropertyMap
                  lat={formData.lat}
                  lng={formData.lng}
                  address={formData.location}
                />
              </div>
            ) : (
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600"
                  alt="Map View Placeholder"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-white/90 text-nordic px-3 py-1.5 rounded shadow-sm backdrop-blur-sm text-xs font-bold font-sans flex items-center gap-1">
                    <span className="material-icons text-sm text-mosque">
                      map
                    </span>{' '}
                    {t.map_location}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-24">
          <div className="px-6 py-4 border-b border-hint-of-green/30 flex items-center gap-3 bg-linear-to-r from-hint-of-green/10 to-transparent">
            <div className="w-8 h-8 rounded-full bg-hint-of-green flex items-center justify-center text-nordic">
              <span className="material-icons text-lg">straighten</span>
            </div>
            <h2 className="text-lg font-bold text-nordic">{t.details}</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label
                  className="text-xs text-gray-500 font-medium font-sans mb-1 block"
                  htmlFor="sqft"
                >
                  {t.area_label}
                </label>
                <input
                  id="sqft"
                  type="number"
                  min="0"
                  value={formData.sqft}
                  onChange={handleInputChange}
                  className="w-full text-left px-3 py-2 rounded border-gray-200 bg-gray-50 text-nordic focus:bg-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sans text-sm"
                  placeholder="0"
                />
              </div>
              <div className="group">
                <label
                  className="text-xs text-gray-500 font-medium font-sans mb-1 block"
                  htmlFor="year_built"
                >
                  {t.year_built}
                </label>
                <input
                  id="year_built"
                  type="number"
                  value={formData.year_built ?? ''}
                  onChange={handleInputChange}
                  className="w-full text-left px-3 py-2 rounded border-gray-200 bg-gray-50 text-nordic focus:bg-white focus:ring-1 focus:ring-mosque focus:border-mosque transition-all font-sans text-sm"
                  placeholder={t.year_placeholder}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-nordic font-sans flex items-center gap-2">
                  <span className="material-icons text-gray-400 text-sm">
                    bed
                  </span>{' '}
                  {t.bedrooms}
                </label>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => decrementValue('beds')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={formData.beds}
                    className="w-10 text-center border-none bg-transparent text-nordic p-0 focus:ring-0 text-sm font-medium font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => incrementValue('beds')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-nordic font-sans flex items-center gap-2">
                  <span className="material-icons text-gray-400 text-sm">
                    shower
                  </span>{' '}
                  {t.bathrooms}
                </label>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => decrementValue('baths')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={formData.baths}
                    className="w-10 text-center border-none bg-transparent text-nordic p-0 focus:ring-0 text-sm font-medium font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => incrementValue('baths')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-nordic font-sans flex items-center gap-2">
                  <span className="material-icons text-gray-400 text-sm">
                    directions_car
                  </span>{' '}
                  {t.parking}
                </label>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => decrementValue('parking')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={formData.parking ?? 0}
                    className="w-10 text-center border-none bg-transparent text-nordic p-0 focus:ring-0 text-sm font-medium font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => incrementValue('parking')}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h3 className="text-sm font-bold text-nordic mb-3 font-sans uppercase tracking-wider">
                {t.amenities_title}
              </h3>
              <div className="space-y-2">
                {AMENITIES_LIST.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={(formData.amenities || []).includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-mosque border-gray-300 rounded focus:ring-mosque"
                    />
                    <span className="text-sm text-gray-700 font-sans group-hover:text-nordic transition-colors">
                      {t.amenities_list[amenity] ?? amenity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden z-40 flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/properties')}
          className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-nordic font-medium font-sans"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg bg-mosque text-white font-medium font-sans flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="material-icons animate-spin">refresh</span>
          ) : (
            t.save
          )}
        </button>
      </div>

      {/* Desktop sticky action bar (optional but nice for long forms) */}
      <div className="hidden md:flex xl:col-span-12 justify-end gap-3 sticky bottom-0 bg-clear-day/90 backdrop-blur-sm py-4 border-t border-nordic/5 z-40">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-nordic font-medium hover:bg-gray-50 transition-colors"
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-lg bg-mosque hover:bg-mosque/90 text-white font-medium shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <span className="material-icons animate-spin">refresh</span>
          ) : (
            <>
              <span className="material-icons text-sm">save</span>
              {t.save_property}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
