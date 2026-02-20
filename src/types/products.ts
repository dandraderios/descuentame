// Tipos para los productos
export interface StoreInfo {
  store_id: string;
  store_name: string;
  country: string;
  product_url: string;
}

export interface PriceInfo {
  cmr_price: string | null;
  current_price: string | null;
  old_price: string | null;
  discount: string | null;
  coupon: string | null;
  installment_price?: string | null;
  installment_quantity?: number | null;
  currency: string;
}

export interface Product {
  product_id: string;
  store: StoreInfo;
  product_name: string;
  brand: string | null;
  sku: string | null;
  category: string | null;
  description: string | null;
  prices: PriceInfo;
  screenshot_url: string | null;
  feed_image_url: string | null;
  story_image_url: string | null;
  product_images: string[];
  status: "draft" | "published" | "archived";
  market_place: string;
  link_afiliados: string | null;
  link_market: string | null;
  created_at: string;
  updated_at: string;
  generated_at: string | null;
  metadata: Record<string, any>;
  blob_paths?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface ProductListResponse {
  total: number;
  limit: number;
  skip: number;
  products: Product[];
}

export interface ProductListRequest {
  status?: string;
  store?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ProductUpdateRequest {
  product_id: string;
  product_name?: string;
  status?: string;
  link_afiliados?: string | null;
  link_market?: string | null;
  feed_image_url?: string | null;
  story_image_url?: string | null;
  metadata?: Record<string, any>;
}
