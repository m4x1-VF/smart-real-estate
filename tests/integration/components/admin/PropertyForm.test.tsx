// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} data-testid="next-image" />;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

// Mock next/navigation
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

// Mock server actions
const savePropertyMock = vi.fn().mockResolvedValue(undefined);
const uploadImageMock = vi.fn();
vi.mock('@/app/admin/properties/actions', () => ({
  saveProperty: (...args: unknown[]) => savePropertyMock(...args),
  uploadImage: (...args: unknown[]) => uploadImageMock(...args),
}));

// Mock optimizeImage (used for image uploads)
const optimizeImageMock = vi.fn();
vi.mock('@/lib/optimize-image', () => ({
  optimizeImage: (...args: unknown[]) => optimizeImageMock(...args),
}));

// Mock DynamicPropertyMap so we don't pull in Leaflet
vi.mock('@/components/DynamicPropertyMap', () => ({
  default: function MockMap() {
    return <div data-testid="mock-map">Map</div>;
  },
}));

import PropertyForm from '@/components/admin/PropertyForm';
import type { DashboardPropertyFormDict } from '@/types/i18n';

const MOCK_FORM_T: DashboardPropertyFormDict = {
  breadcrumb: {
    properties: 'PF_BC_PROPS',
    add_new: 'PF_BC_ADD',
    edit: 'PF_BC_EDIT_{title}',
  },
  basic_information: 'PF_BASIC',
  description_title: 'PF_DESC',
  gallery: 'PF_GALLERY',
  location: 'PF_LOC',
  details: 'PF_DET',
  amenities_title: 'PF_AMEN',
  featured: 'PF_FEATURED',
  active: 'PF_ACTIVE',
  inactive: 'PF_INACTIVE',
  property_title: 'PF_PROP_TITLE',
  title_placeholder: 'PF_TITLE_PH',
  price: 'PF_PRICE',
  price_placeholder: 'PF_PRICE_PH',
  property_type: 'PF_TYPE',
  type_sale: 'PF_SALE',
  type_rent: 'PF_RENT',
  address: 'PF_ADDR',
  address_placeholder: 'PF_ADDR_PH',
  latitude: 'PF_LAT',
  lat_placeholder: 'PF_LAT_PH',
  longitude: 'PF_LNG',
  lng_placeholder: 'PF_LNG_PH',
  map_location: 'PF_MAP_LOC',
  year_built: 'PF_YEAR',
  bedrooms: 'PF_BEDROOMS',
  bathrooms: 'PF_BATHROOMS',
  parking: 'PF_PARKING',
  area_label: 'PF_AREA',
  file_formats: 'PF_FF',
  drop_zone: 'PF_DROP',
  max_size: 'PF_MAX',
  uploading: 'PF_UPLOAD',
  main: 'PF_MAIN',
  cancel: 'PF_CANCEL',
  save: 'PF_SAVE',
  save_property: 'PF_SAVE_PROP',
  character_counter: 'PF_CHAR_{count}',
  format_bold: 'PF_BOLD',
  format_italic: 'PF_ITALIC',
  format_list: 'PF_LIST',
  breadcrumb_aria: 'PF_BC_ARIA',
  description_placeholder: 'PF_DESC_PH',
  year_placeholder: 'PF_YEAR_PH',
  amenities_list: {
    'Swimming Pool': 'PF_POOL',
    Garden: 'PF_GARDEN',
    'Air Conditioning': 'PF_AC',
    'Smart Home': 'PF_SMART',
    Balcony: 'PF_BALCONY',
    Gym: 'PF_GYM',
    'Security System': 'PF_SEC',
    Elevator: 'PF_ELEV',
  },
  errors: {
    invalid_file_type: 'PF_ERR_INVALID_{name}',
    file_exceeds_size: 'PF_ERR_SIZE_{name}',
    failed_to_optimize: 'PF_ERR_OPT',
    failed_to_upload: 'PF_ERR_UPL',
    failed_to_save: 'PF_ERR_SAVE',
  },
};

describe('PropertyForm (T14 → R8, R9, R10, R13, R15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders every visible string from the dict prop', () => {
    render(<PropertyForm t={MOCK_FORM_T} />);

    // Section headers
    expect(screen.getByText('PF_BASIC')).toBeInTheDocument();
    expect(screen.getByText('PF_DESC')).toBeInTheDocument();
    expect(screen.getByText('PF_GALLERY')).toBeInTheDocument();
    expect(screen.getByText('PF_LOC')).toBeInTheDocument();
    expect(screen.getByText('PF_DET')).toBeInTheDocument();
    expect(screen.getByText('PF_AMEN')).toBeInTheDocument();

    // Labels
    expect(screen.getByText('PF_PROP_TITLE')).toBeInTheDocument();
    expect(screen.getByText('PF_PRICE')).toBeInTheDocument();
    expect(screen.getByText('PF_TYPE')).toBeInTheDocument();
    expect(screen.getByText('PF_ADDR')).toBeInTheDocument();
    expect(screen.getByText('PF_LAT')).toBeInTheDocument();
    expect(screen.getByText('PF_LNG')).toBeInTheDocument();
    expect(screen.getByText('PF_YEAR')).toBeInTheDocument();
    expect(screen.getByText('PF_BEDROOMS')).toBeInTheDocument();
    expect(screen.getByText('PF_BATHROOMS')).toBeInTheDocument();
    expect(screen.getByText('PF_PARKING')).toBeInTheDocument();
    expect(screen.getByText('PF_AREA')).toBeInTheDocument();
    expect(screen.getByText('PF_FEATURED')).toBeInTheDocument();

    // Gallery chip + drop zone
    expect(screen.getByText('PF_FF')).toBeInTheDocument();
    expect(screen.getByText('PF_DROP')).toBeInTheDocument();
    expect(screen.getByText('PF_MAX')).toBeInTheDocument();

    // Property type options
    expect(screen.getByText('PF_SALE')).toBeInTheDocument();
    expect(screen.getByText('PF_RENT')).toBeInTheDocument();

    // Amenity labels (translated)
    expect(screen.getByText('PF_POOL')).toBeInTheDocument();
    expect(screen.getByText('PF_GARDEN')).toBeInTheDocument();
    expect(screen.getByText('PF_AC')).toBeInTheDocument();

    // Placeholders (translated, not English hardcodes)
    expect(screen.getByPlaceholderText('PF_TITLE_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_PRICE_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_DESC_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_ADDR_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_LAT_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_LNG_PH')).toBeInTheDocument();

    // Action buttons (desktop sticky bar — both Cancel labels appear)
    const cancelButtons = screen.getAllByText('PF_CANCEL');
    expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('PF_SAVE_PROP')).toBeInTheDocument();
  });

  it('shows invalid_file_type error with the file name when MIME is rejected', async () => {
    render(<PropertyForm t={MOCK_FORM_T} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Build a File with an invalid MIME type
    const file = new File(['x'], 'bad.pdf', { type: 'application/pdf' });

    // happy-dom does not implement DataTransfer; use fireEvent on the input
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(
        screen.getByText('PF_ERR_INVALID_bad.pdf'),
      ).toBeInTheDocument();
    });
  });

  it('shows file_exceeds_size error when file > 5 MB', async () => {
    render(<PropertyForm t={MOCK_FORM_T} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // 6 MB file with valid MIME
    const bigData = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigData], 'big.jpg', { type: 'image/jpeg' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('PF_ERR_SIZE_big.jpg')).toBeInTheDocument();
    });
  });

  it('submits FormData to saveProperty with the original field names (R10)', async () => {
    savePropertyMock.mockClear();
    render(<PropertyForm t={MOCK_FORM_T} />);

    // Fill the form: title + price. Default is_active=true and no amenities/images.
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const priceInput = document.getElementById('price') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'My Title' } });
    fireEvent.change(priceInput, { target: { value: '123' } });

    const form = document.querySelector('form') as HTMLFormElement;
    expect(form).toBeTruthy();
    fireEvent.submit(form);

    await waitFor(() => {
      expect(savePropertyMock).toHaveBeenCalledTimes(1);
    });

    const formData = savePropertyMock.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('My Title');
    expect(formData.get('price')).toBe('123');
    expect(formData.get('type')).toBe('sale');
    expect(formData.get('location')).toBe('');
    expect(formData.get('beds')).toBe('0');
    expect(formData.get('baths')).toBe('0');
    expect(formData.get('parking')).toBe('0');
    expect(formData.get('sqft')).toBe('0');
    expect(formData.get('is_featured')).toBe('false');
    expect(formData.get('is_active')).toBe('true');
    // amenities + images are JSON-stringified arrays
    expect(formData.get('amenities')).toBe('[]');
    expect(formData.get('images')).toBe('[]');
  });

  it('renders translated placeholders and NOT English hardcodes', () => {
    render(<PropertyForm t={MOCK_FORM_T} />);

    // Verify no English hardcodes remain
    expect(screen.queryByPlaceholderText(/e\.g\./i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Street Address/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Describe the property/i)).not.toBeInTheDocument();

    // Verify translated placeholders are present
    expect(screen.getByPlaceholderText('PF_TITLE_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_ADDR_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_DESC_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_LAT_PH')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PF_LNG_PH')).toBeInTheDocument();
  });

  it('price input has no required attribute so the user can clear it (R10)', () => {
    render(<PropertyForm t={MOCK_FORM_T} />);
    const priceInput = document.getElementById('price') as HTMLInputElement;
    expect(priceInput).toBeTruthy();
    expect(priceInput.hasAttribute('required')).toBe(false);
  });
});
