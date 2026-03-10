import {
  Product,
  ProductListResponse,
  ProductListRequest,
} from "../types/product";
import { getStoredAccessToken } from "../lib/authStorage";

// Debug: ver qué variable de entorno está disponible
console.log(
  "🔍 VITE_API_BASE_URL from import.meta.env:",
  import.meta.env.VITE_API_BASE_URL,
);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
const CRAWL_API_BASE_URL =
  import.meta.env.VITE_CRAWL_API_BASE_URL || "http://localhost:8002";
const rawCrawlTimeoutMs = Number(
  import.meta.env.VITE_CRAWL_API_TIMEOUT_MS || 4500,
);
const CRAWL_API_TIMEOUT_MS =
  Number.isFinite(rawCrawlTimeoutMs) && rawCrawlTimeoutMs > 0
    ? rawCrawlTimeoutMs
    : 4500;
console.log("🔍 Final API_BASE_URL:", API_BASE_URL);
console.log("🔍 Final CRAWL_API_BASE_URL:", CRAWL_API_BASE_URL);

const baseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, max-age=0",
  Pragma: "no-cache",
};

function getHeaders() {
  const token = getStoredAccessToken();
  return {
    ...baseHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CrawlStartResponse {
  status: string;
  url: string;
  store: string;
  country: string;
  generate_feed: boolean;
  generate_story: boolean;
  link_afiliados: string | null;
  fallback_provider?: "hyperbrowser" | "scrape_do";
  product_id: string;
}

// Función para manejar respuestas
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      error.detail || `Error ${response.status}: ${response.statusText}`,
    );
  }
  const data = await response.json();
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }
  return data as T;
}

function shouldFallbackToDirectGenerate(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("econnrefused") ||
    message.includes("fetch")
  );
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onAbort);
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onAbort);
    }
  }
}

// Obtener lista de productos
export async function getProducts(
  request: ProductListRequest = {},
): Promise<ProductListResponse> {
  const endpoint = `${API_BASE_URL}/api/v1/products/list?t=${Date.now()}`;
  console.log("📡 Llamando a:", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      limit: request.limit || 50,
      skip: request.skip || 0,
      status: request.status,
      store: request.store,
      search: request.search,
      sort_by: request.sort_by || "created_at",
      sort_order: request.sort_order || "desc",
    }),
  });

  return handleResponse<ProductListResponse>(response);
}

// Obtener un producto por ID
export async function getProduct(productId: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/get`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ product_id: productId }),
  });

  return handleResponse<Product>(response);
}

// Eliminar un producto
export async function deleteProduct(
  productId: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/delete`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ product_id: productId }),
  });

  return handleResponse<{ success: boolean }>(response);
}

// Publicar/Despublicar producto
export async function publishProduct(
  productId: string,
  action: "publish" | "unpublish" | "archive",
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/publish`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ product_id: productId, action }),
  });

  return handleResponse<Product>(response);
}

// Actualizar campos de producto
export async function updateProduct(
  productId: string,
  payload: Record<string, unknown>,
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/update`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ product_id: productId, ...payload }),
  });

  return handleResponse<Product>(response);
}

// Detectar tienda desde URL
export async function detectStore(
  url: string,
): Promise<{ detected_store: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/detect-store`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ url }),
  });

  return handleResponse<{ detected_store: string }>(response);
}

// Generar imágenes para un producto
export async function generateProduct(request: {
  url: string;
  store: string;
  country?: string;
  generate_feed?: boolean;
  generate_story?: boolean;
  link_afiliados?: string;
  fallback_provider?: "hyperbrowser" | "scrape_do";
}, options?: { signal?: AbortSignal }): Promise<CrawlStartResponse> {
  const payload = {
    url: request.url,
    store: request.store,
    country: request.country || "cl",
    generate_feed: request.generate_feed ?? true,
    generate_story: request.generate_story ?? true,
    link_afiliados: request.link_afiliados,
    fallback_provider: request.fallback_provider || "hyperbrowser",
  };
  const crawlEndpoint = `${CRAWL_API_BASE_URL}/crawl`;
  console.log("📡 Generando producto vía crawler:", crawlEndpoint);

  try {
    const crawlResponse = await fetchWithTimeout(
      crawlEndpoint,
      {
        method: "POST",
        headers: getHeaders(),
        cache: "no-store",
        body: JSON.stringify(payload),
      },
      CRAWL_API_TIMEOUT_MS,
      options?.signal,
    );
    return await handleResponse<CrawlStartResponse>(crawlResponse);
  } catch (error) {
    if (!shouldFallbackToDirectGenerate(error)) {
      throw error;
    }
    const directEndpoint = `${API_BASE_URL}/api/v1/generate`;
    console.warn(
      "⚠️ Crawler no disponible. Fallback a backend directo:",
      directEndpoint,
    );
    const directResponse = await fetch(directEndpoint, {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      signal: options?.signal,
      body: JSON.stringify(payload),
    });
    return handleResponse<CrawlStartResponse>(directResponse);
  }
}
