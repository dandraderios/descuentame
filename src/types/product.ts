// types/product.ts

export interface StoreInfo {
  store_id: string;
  store_name: string;
  country: string;
  product_url: string;
}

export interface PriceInfo {
  cmr_price: string | null;
  cmr_price_validity: string | null;
  cmr_price_date: string | null;
  current_price: string | null;
  old_price: string | null;
  discount: string | null;
  coupon: string | null;
  installment_price: string | null;
  installment_quantity: string | null;
  currency: string;
  event_price_validity: string | null;
  event_price_date: string | null;
}

export interface Product {
  // ✅ AÑADIR ESTE CAMPO (el que viene de MongoDB)
  id?: string; // ← NUEVO: el _id de MongoDB mapeado como id
  _id?: string; // ← Por compatibilidad con código anterior

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
  metrics?: {
    total_clicks: number;
    last_click: string | null;
  };
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  limit: number;
  skip: number;
}

export interface ProductListRequest {
  status?: string;
  store?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sort_by?: string;
  sort_order?: string;
}
