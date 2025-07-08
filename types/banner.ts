export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: 'main' | 'card1' | 'card2' | 'card3' | 'card4';
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BannerFormData {
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: 'main' | 'card1' | 'card2' | 'card3' | 'card4';
  is_active: boolean;
  sort_order: number;
}

export interface BannerFilters {
  position?: string;
  is_active?: boolean;
}

export interface BannerUploadResponse {
  url: string;
  path: string;
  error?: string;
} 