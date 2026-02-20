// src/components/tables/BasicTables/ProductsTable.tsx
import { useState, useEffect } from "react";
import { Product } from "../../../types/product";
import {
  getProducts,
  deleteProduct,
  publishProduct,
  getProduct,
} from "../../../api/products";
import { Modal } from "../../ui/modal";

// Iconos
import {
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Archive,
  ExternalLink,
  Image,
  Calendar,
  RefreshCw,
  Copy,
  Link,
  Store,
  Clock,
  DollarSign,
  Percent,
  Award,
  Search,
} from "lucide-react";

interface ProductsTableProps {
  initialStatus?: string;
  initialStore?: string;
}

export default function ProductsTable({
  initialStatus,
  initialStore,
}: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: initialStatus || "",
    store: initialStore || "",
    limit: 50,
    skip: 0,
  });
  const [total, setTotal] = useState(0);

  // Efecto para debounce de búsqueda (sin NodeJS.Timeout)
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setFilters((prev) => ({ ...prev, skip: 0 }));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  // Cargar productos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        ...filters,
        search: debouncedSearchTerm || undefined,
      });
      setProducts(response.products);
      setTotal(response.total);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters, debouncedSearchTerm]);

  // Ver detalle de producto
  const handleViewDetail = async (productId: string) => {
    setLoadingDetail(true);
    try {
      const product = await getProduct(productId);
      setDetailProduct(product);
      setShowDetailModal(true);
    } catch (err) {
      alert(
        `Error al cargar detalle: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  // Cerrar modal de detalle
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailProduct(null);
  };

  // Copiar al portapapeles
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado al portapapeles`);
  };

  // Cambiar estado de producto
  const handleStatusChange = async (
    productId: string,
    action: "publish" | "unpublish" | "archive",
  ) => {
    try {
      const updated = await publishProduct(productId, action);
      setProducts(
        products.map((p) => (p.product_id === productId ? updated : p)),
      );
      if (detailProduct?.product_id === productId) {
        setDetailProduct(updated);
      }
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  // Eliminar producto
  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter((p) => p.product_id !== productId));
      setShowDeleteConfirm(null);
      if (detailProduct?.product_id === productId) {
        closeDetailModal();
      }
    } catch (err) {
      alert(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatear fecha solo fecha
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Obtener color según estado
  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Obtener color según tienda
  const getStoreBadge = (storeId: string) => {
    const colors = {
      falabella: "bg-red-100 text-red-800",
      ripley: "bg-blue-100 text-blue-800",
      paris: "bg-purple-100 text-purple-800",
      mercadolibre: "bg-yellow-100 text-yellow-800",
    };
    return (
      colors[storeId as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filtros y buscador */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex gap-4 flex-wrap items-center">
          {/* Buscador */}
          <div className="flex-1 min-w-[300px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, ID, SKU o marca..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, skip: 0 })
            }
            className="px-3 py-2 border rounded-lg min-w-[150px]"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>

          <select
            value={filters.store}
            onChange={(e) =>
              setFilters({ ...filters, store: e.target.value, skip: 0 })
            }
            className="px-3 py-2 border rounded-lg min-w-[150px]"
          >
            <option value="">Todas las tiendas</option>
            <option value="falabella">Falabella</option>
            <option value="ripley">Ripley</option>
            <option value="paris">Paris</option>
            <option value="mercadolibre">MercadoLibre</option>
          </select>

          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>

          <span className="text-sm text-gray-600 self-center whitespace-nowrap">
            {products.length} productos
            {debouncedSearchTerm && ` filtrados para "${debouncedSearchTerm}"`}
          </span>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr
                    key={product.product_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetail(product.product_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.feed_image_url ? (
                          <img
                            src={product.feed_image_url}
                            alt={product.product_name}
                            className="w-10 h-10 object-cover rounded mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                            <Image size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 max-w-xs truncate">
                            {product.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product.product_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStoreBadge(product.store.store_id)}`}
                      >
                        {product.store.store_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {product.prices.current_price && (
                          <div className="text-sm font-medium text-red-600">
                            {product.prices.current_price}
                          </div>
                        )}
                        {product.prices.old_price && (
                          <div className="text-xs text-gray-500 line-through">
                            {product.prices.old_price}
                          </div>
                        )}
                        {product.prices.cmr_price && (
                          <div className="text-xs text-blue-600">
                            CMR: {product.prices.cmr_price}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.prices.discount ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {product.prices.discount}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {product.prices.coupon && (
                        <div className="text-xs text-purple-600 mt-1">
                          🏷️ {product.prices.coupon}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(product.status)}`}
                      >
                        {product.status === "draft" && "Borrador"}
                        {product.status === "published" && "Publicado"}
                        {product.status === "archived" && "Archivado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(product.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Icono de imagen - Prioriza story, fallback a feed */}
                        {product.story_image_url ? (
                          <a
                            href={product.story_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver story"
                          >
                            <Image size={18} />
                          </a>
                        ) : product.feed_image_url ? (
                          <a
                            href={product.feed_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver feed"
                          >
                            <Image size={18} />
                          </a>
                        ) : (
                          <span
                            className="text-gray-400 cursor-not-allowed"
                            title="Sin imagen"
                          >
                            <Image size={18} />
                          </span>
                        )}

                        <button
                          onClick={() => handleViewDetail(product.product_id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>

                        {product.status === "draft" && (
                          <button
                            onClick={() =>
                              handleStatusChange(product.product_id, "publish")
                            }
                            className="text-green-600 hover:text-green-900"
                            title="Publicar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}

                        {product.status === "published" && (
                          <button
                            onClick={() =>
                              handleStatusChange(
                                product.product_id,
                                "unpublish",
                              )
                            }
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Despublicar"
                          >
                            <XCircle size={18} />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleStatusChange(product.product_id, "archive")
                          }
                          className="text-gray-600 hover:text-gray-900"
                          title="Archivar"
                        >
                          <Archive size={18} />
                        </button>

                        {product.link_market && (
                          <a
                            href={product.link_market}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-900"
                            title="Ver en tienda"
                          >
                            <ExternalLink size={18} />
                          </a>
                        )}

                        <button
                          onClick={() =>
                            setShowDeleteConfirm(product.product_id)
                          }
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Confirmación de eliminación */}
                      {showDeleteConfirm === product.product_id && (
                        <div className="absolute bg-white border rounded-lg shadow-lg p-4 mt-2 z-10">
                          <p className="text-sm mb-2">¿Eliminar producto?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(product.product_id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-3 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        className="max-w-4xl w-full"
        showCloseButton={true}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            detailProduct && (
              <div className="space-y-6">
                {/* Título */}
                <h2 className="text-2xl font-bold text-gray-900 pr-8">
                  {detailProduct.product_name}
                </h2>

                {/* Badges de tienda y estado */}
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getStoreBadge(detailProduct.store.store_id)}`}
                  >
                    {detailProduct.store.store_name}
                  </span>
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(detailProduct.status)}`}
                  >
                    {detailProduct.status === "draft" && "Borrador"}
                    {detailProduct.status === "published" && "Publicado"}
                    {detailProduct.status === "archived" && "Archivado"}
                  </span>
                </div>

                {/* Imágenes */}
                {(detailProduct.feed_image_url ||
                  detailProduct.story_image_url) && (
                  <div className="grid grid-cols-2 gap-4">
                    {detailProduct.feed_image_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Feed
                        </p>
                        <a
                          href={detailProduct.feed_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={detailProduct.feed_image_url}
                            alt="Feed"
                            className="w-full h-auto rounded-lg border"
                          />
                        </a>
                      </div>
                    )}
                    {detailProduct.story_image_url && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Story
                        </p>
                        <a
                          href={detailProduct.story_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={detailProduct.story_image_url}
                            alt="Story"
                            className="w-full h-auto rounded-lg border"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Información básica */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <span>ID Producto:</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-sm bg-white px-2 py-1 rounded border">
                        {detailProduct.product_id}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(detailProduct.product_id, "ID")
                        }
                        className="text-blue-600 hover:text-blue-800"
                        title="Copiar ID"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {detailProduct.sku && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span>SKU:</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm bg-white px-2 py-1 rounded border">
                          {detailProduct.sku}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(detailProduct.sku!, "SKU")
                          }
                          className="text-blue-600 hover:text-blue-800"
                          title="Copiar SKU"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {detailProduct.brand && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Award size={16} />
                        <span>Marca:</span>
                      </div>
                      <p className="font-medium">{detailProduct.brand}</p>
                    </div>
                  )}
                </div>

                {/* Precios */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Precios
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {detailProduct.prices.current_price && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-red-700 mb-1">
                          <DollarSign size={16} />
                          <span>Actual</span>
                        </div>
                        <p className="text-xl font-bold text-red-600">
                          {detailProduct.prices.current_price}
                        </p>
                      </div>
                    )}
                    {detailProduct.prices.old_price && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <DollarSign size={16} />
                          <span>Normal</span>
                        </div>
                        <p className="text-xl font-bold text-gray-500 line-through">
                          {detailProduct.prices.old_price}
                        </p>
                      </div>
                    )}
                    {detailProduct.prices.cmr_price && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                          <DollarSign size={16} />
                          <span>CMR</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {detailProduct.prices.cmr_price}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descuento y Cupón */}
                {(detailProduct.prices.discount ||
                  detailProduct.prices.coupon) && (
                  <div className="grid grid-cols-2 gap-4">
                    {detailProduct.prices.discount && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                          <Percent size={16} />
                          <span>Descuento</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          {detailProduct.prices.discount}% OFF
                        </p>
                      </div>
                    )}
                    {detailProduct.prices.coupon && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-purple-700 mb-1">
                          <Award size={16} />
                          <span>Cupón</span>
                        </div>
                        <p className="text-lg font-bold text-purple-600">
                          {detailProduct.prices.coupon}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Links */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Enlaces
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-gray-600" />
                        <span className="text-sm text-gray-600">
                          URL del producto:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={detailProduct.store.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Ver en {detailProduct.store.store_name}
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              detailProduct.store.product_url,
                              "URL",
                            )
                          }
                          className="text-gray-500 hover:text-gray-700"
                          title="Copiar URL"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    {detailProduct.link_afiliados && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Link size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">
                            Link afiliado:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={detailProduct.link_afiliados}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Abrir link
                          </a>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                detailProduct.link_afiliados!,
                                "Link afiliado",
                              )
                            }
                            className="text-gray-500 hover:text-gray-700"
                            title="Copiar link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {detailProduct.link_market && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Store size={16} className="text-gray-600" />
                          <span className="text-sm text-gray-600">
                            Link market:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={detailProduct.link_market}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Ver en tienda
                          </a>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                detailProduct.link_market!,
                                "Link market",
                              )
                            }
                            className="text-gray-500 hover:text-gray-700"
                            title="Copiar link"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Creado</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      {formatShortDate(detailProduct.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Actualizado</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      {formatShortDate(detailProduct.updated_at)}
                    </p>
                  </div>
                  {detailProduct.generated_at && (
                    <div>
                      <p className="text-gray-600 mb-1">Generado</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {formatShortDate(detailProduct.generated_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {detailProduct.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {detailProduct.description}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                {detailProduct.metadata &&
                  Object.keys(detailProduct.metadata).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Metadatos
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(detailProduct.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                {/* Acciones dentro del modal */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                  {detailProduct.status === "draft" && (
                    <button
                      onClick={() => {
                        handleStatusChange(detailProduct.product_id, "publish");
                        closeDetailModal();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Publicar
                    </button>
                  )}
                  {detailProduct.status === "published" && (
                    <button
                      onClick={() => {
                        handleStatusChange(
                          detailProduct.product_id,
                          "unpublish",
                        );
                        closeDetailModal();
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Despublicar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(detailProduct.product_id);
                      closeDetailModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </Modal>
    </>
  );
}
