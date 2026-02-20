import {
  Product,
  ProductListResponse,
  ProductListRequest,
  ProductUpdateRequest,
} from "../types/product";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

// Headers por defecto
const headers = {
  "Content-Type": "application/json",
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
  const response = await fetch(`${API_BASE_URL}/api/v1/products/list`, {
    method: "POST",
    headers,
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
    body: JSON.stringify({ product_id: productId }),
  });

  return handleResponse<Product>(response);
}

// Actualizar un producto
export async function updateProduct(
  request: ProductUpdateRequest,
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/v1/products/update`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
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
    body: JSON.stringify({ url }),
  });

  return handleResponse<{ detected_store: string }>(response);
}

// Listar tiendas disponibles
export async function listStores(): Promise<{ stores: any[] }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stores/list`, {
    method: "POST",
    headers,
  });

  return handleResponse<{ stores: any[] }>(response);
}

// Generar imágenes para un producto
export async function generateProduct(request: {
  url: string;
  store: string;
  country?: string;
  generate_feed?: boolean;
  generate_story?: boolean;
}): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: request.url,
      store: request.store,
      country: request.country || "cl",
      generate_feed: request.generate_feed ?? true,
      generate_story: request.generate_story ?? true,
    }),
  });

  return handleResponse<Product>(response);
}
