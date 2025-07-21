export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number | null;
  max_uses: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
} 