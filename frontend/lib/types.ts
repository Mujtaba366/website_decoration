export type ProductType = 'rental' | 'sale';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ProductType;
  category: string | null;
  base_price: number;
  images: string[];
  personalization_label: string | null;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  qty: number;
  personalization?: string;
}

export type BookingStatus = 'enquiry' | 'confirmed' | 'paid' | 'completed';

export interface Booking {
  id: string;
  product_id: string;
  customer_name: string;
  contact: string;
  event_date: string;
  // Free text mirroring the chosen delivery option's label - no longer
  // restricted to 'setup'/'pickup' now that delivery options are admin-configurable.
  fulfillment_type: string;
  delivery_option_id: string | null;
  address: string | null;
  is_within_auckland: boolean | null;
  extra_fee: number | null;
  status: BookingStatus;
  message: string | null;
  created_at: string;
}

export interface RentalAvailability {
  id: string;
  product_id: string;
  date: string;
  is_available: boolean;
  booking_id: string | null;
}

export interface Message {
  id: string;
  product_id: string | null;
  booking_id: string | null;
  sender_name: string;
  content: string;
  created_at: string;
}

export interface DeliveryOption {
  id: string;
  label: string;
  description: string | null;
  fee: number;
  is_default: boolean;
  active: boolean;
  sort_order: number;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  booking_id: string | null;
}

export interface SiteSettings {
  site_name: string;
  tagline: string | null;
  support_email: string | null;
  phone: string | null;
  location: string | null;
  logo_url: string | null;
  instagram_handle: string | null;
  service_area_note: string | null;
  hero_eyebrow: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  about_heading: string | null;
  about_subheading: string | null;
  about_story: string | null;
  how_it_works_heading: string | null;
  how_it_works_subheading: string | null;
}
