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
  saved_title: string;
  saved_empty: string;
  all_properties: string;
  all_properties_subtitle: string;
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

// --- Dashboard i18n (admin panel) -----------------------------------------

export interface DashboardNavDict {
  dashboard: string;
  properties: string;
  users: string;
  administrator: string;
  // 'Cerrar sesión' queda hardcodeado por R17.
}

export interface DashboardLayoutDict {
  forbidden_title: string;
  forbidden_message: string;
  // El footer queda hardcodeado por R17.
}

export interface DashboardPropertiesListDict {
  title: string;
  subtitle: string;
  add_new_property: string;
  stats: {
    total_listings: string;
    active_listings: string;
    inactive_listings: string;
  };
  table: {
    property_details: string;
    price: string;
    status: string;
    actions: string;
  };
  badges: {
    active: string;
    inactive: string;
    featured: string;
  };
  titles: {
    edit_property: string;
    activate_property: string;
    deactivate_property: string;
  };
  empty: string;
  pagination: {
    showing: string; // "Showing {from} to {to} of {total} results"
  };
  beds: string; // "Hab" / "Beds" / "Lits" — label del icon en el listado
  baths: string; // "Baños" / "Baths" / "Salles de bain"
  type_sale: string; // "Venta" / "Sale" / "Vente" — traducción de property.type === 'sale'
  type_rent: string; // "Alquiler" / "Rent" / "Location" — traducción de property.type === 'rent'
}

export interface DashboardPropertyFormDict {
  breadcrumb: {
    properties: string;
    add_new: string;
    edit: string; // "Edit {title}"
  };
  basic_information: string;
  description_title: string;
  gallery: string;
  location: string;
  details: string;
  amenities_title: string;
  featured: string;
  active: string;
  inactive: string;
  property_title: string;
  price: string;
  property_type: string;
  type_sale: string; // label visible del <option value="sale">
  type_rent: string; // label visible del <option value="rent">
  address: string;
  latitude: string;
  longitude: string;
  map_location: string;
  year_built: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  area_label: string; // "Área (m²)" / "Area (m²)" / "Surface (m²)"
  file_formats: string;
  drop_zone: string;
  max_size: string;
  uploading: string;
  main: string;
  cancel: string;
  save: string;
  save_property: string;
  character_counter: string; // "{count} / 2000 characters"
  amenities_list: Record<string, string>;
  format_bold: string;
  format_italic: string;
  format_list: string;
  breadcrumb_aria: string;
  year_placeholder: string; // "YYYY" / "AAAA" / "AAAA"
  errors: {
    invalid_file_type: string; // placeholders: {name}
    file_exceeds_size: string; // placeholders: {name}
    failed_to_optimize: string;
    failed_to_upload: string;
    failed_to_save: string;
  };
}

export interface DashboardUsersListDict {
  title: string;
  subtitle: string;
  search_placeholder: string;
  add_user: string;
  tabs: {
    all: string;
    agents: string;
    brokers: string;
    admins: string;
  };
  table: {
    user_details: string;
    role_status: string;
    performance: string;
    actions: string;
  };
  badges: {
    administrator: string;
    user: string;
    active: string;
  };
  performance: {
    properties: string;
    access_level: string;
  };
  actions: {
    make_admin: string;
    remove_admin: string;
  };
  empty: string;
  pagination: {
    showing: string;
  };
  unknown_user: string; // fallback cuando email es null
}

export interface DashboardCommonDict {
  required: string;
  fields_mandatory: string;
  page_title_create: string;
  page_subtitle_create: string;
  page_title_edit: string;
  page_subtitle_edit: string;
  forbidden_title: string;
  forbidden_message: string;
}

export interface DashboardErrorsDict {
  save_failed: string;
  upload_failed: string;
  invalid_file_type: string;
  file_exceeds_size: string;
  no_file: string;
}

export interface DashboardDict {
  nav: DashboardNavDict;
  layout: DashboardLayoutDict;
  properties_list: DashboardPropertiesListDict;
  property_form: DashboardPropertyFormDict;
  users_list: DashboardUsersListDict;
  common: DashboardCommonDict;
  errors: DashboardErrorsDict;
}

export interface Dictionary {
  navbar: NavbarDict;
  hero: HeroDict;
  common: CommonDict;
  filters: FiltersDict;
  property_detail: PropertyDetailDict;
  gallery: GalleryDict;
  featured: FeaturedDict;
  dashboard: DashboardDict;
}
