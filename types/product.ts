export interface Product {
  id: string;
  name: string;
  slug: string;
  generic_name: string | null;
  dosage_form: string | null;
  pack_size: string | null;
  sku: string;
  price_regular: number;
  price_offer: number | null;
  price_purchase?: number | null;
  stock: number;
  image_urls: string[];
  video: string | null;
  description: string;
  category_id: string | null;
  company_id: string | null;
  is_active: boolean;
  flash_sale: boolean | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  company?: Company;
  keywords?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  parent?: Category;
  children?: Category[];
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  // Add other fields as needed
}

export type { Banner } from './banner';

export interface ProductFilters {
  search?: string;
  category_id?: string;
  company_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  sort_by?: 'name' | 'price_regular' | 'created_at';
  sort_order?: 'asc' | 'desc';
} 