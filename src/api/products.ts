import {
  Product,
  ProductListResponse,
  ProductListRequest,
} from "../types/product";

// Debug: ver qué variable de entorno está disponible
console.log(
  "🔍 VITE_API_BASE_URL from import.meta.env:",
  import.meta.env.VITE_API_BASE_URL,
);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
console.log("🔍 Final API_BASE_URL:", API_BASE_URL);

// Headers por defecto
const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, max-age=0",
  Pragma: "no-cache",
};

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
  return data.data as T;
}

// Obtener lista de productos
export async function getProducts(
  request: ProductListRequest = {},
): Promise<ProductListResponse> {
  const endpoint = `${API_BASE_URL}/api/v1/products/list?t=${Date.now()}`;
  console.log("📡 Llamando a:", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
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
    headers,
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
    headers,
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
    headers,
    cache: "no-store",
    body: JSON.stringify({ product_id: productId, action }),
  });

  return handleResponse<Product>(response);
}

// Detectar tienda desde URL
export async function detectStore(
  url: string,
): Promise<{ detected_store: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/detect-store`, {
    method: "POST",
    headers,
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
}): Promise<Product> {
  console.log("📡 Generando producto en:", `${API_BASE_URL}/api/v1/generate`);

  const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      url: request.url,
      store: request.store,
      country: request.country || "cl",
      generate_feed: request.generate_feed ?? true,
      generate_story: request.generate_story ?? true,
      link_afiliados: request.link_afiliados,
    }),
  });

  return handleResponse<Product>(response);
}
