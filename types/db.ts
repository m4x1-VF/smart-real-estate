export type PropertyType = 'sale' | 'rent';

export type AppRole = 'admin' | 'user';

export interface Property {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  price: number;
  type: PropertyType;
  location: string;
  lat: number | null;
  lng: number | null;
  beds: number;
  baths: number;
  parking: number | null;
  sqft: number;
  year_built: number | null;
  images: string[];
  amenities: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export type NewPropertyInput = Omit<Property, 'id' | 'created_at'> & {
  created_at?: string;
};

export interface UpdatePropertyInput {
  id: string;
  patch: Partial<NewPropertyInput>;
}
