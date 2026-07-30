export interface HeroDict {
  title_start: string;
  title_highlight: string;
  title_end: string;
  subtitle: string;
  search_placeholder: string;
  search_button: string;
  all: string;
  filters: string;
  penthouse: string;
}

export interface FiltersDict {
  title: string;
  location: string;
  location_placeholder: string;
  price_range: string;
  min_price: string;
  max_price: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  amenities_title: string;
  amenities: Record<string, string>;
  clear_all: string;
  show_homes: string;
  show_count_homes: string;
}

export interface CommonDict {
  featured_properties: string;
  new_in_market: string;
  fresh_subtitle: string;
  view_details: string;
  any_type: string;
  any: string;
  all: string;
  for_rent: string;
  beds_label: string;
  baths_label: string;
  property_types: {
    villa: string;
    house: string;
    apartment: string;
    condo: string;
    townhouse: string;
    penthouse: string;
  };
  beds: string;
  baths: string;
  sqm: string;
}

export interface PropertyDetailDict {
  schedule_visit: string;
  contact_agent: string;
  property_features: string;
  square_meters: string;
  bedrooms: string;
  bathrooms: string;
  garage: string;
  about_home: string;
  read_more: string;
  amenities: string;
  smart_home: string;
  swimming_pool: string;
  heating_cooling: string;
  ev_charging: string;
  private_gym: string;
  wine_cellar: string;
  estimated_payment: string;
  starting_from: string;
  down: string;
  calculate_mortgage: string;
  map_unavailable: string;
  top_rated_agent: string;
  footer_rights: string;
  amenity_labels: Record<string, string>;
}

export interface NavbarDict {
  buy: string;
  rent: string;
  sell: string;
  saved_homes: string;
  login: string;
}

export interface GalleryDict {
  premium: string;
  view_all_photos: string;
}

export interface FeaturedDict {
  subtitle: string;
  view_all: string;
  new_arrival: string;
  exclusive: string;
}

export interface Dictionary {
  navbar: NavbarDict;
  hero: HeroDict;
  common: CommonDict;
  filters: FiltersDict;
  property_detail: PropertyDetailDict;
  gallery: GalleryDict;
  featured: FeaturedDict;
}
