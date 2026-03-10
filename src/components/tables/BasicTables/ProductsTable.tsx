import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Product } from "../../../types/product";
import {
  getProducts,
  deleteProduct,
  publishProduct,
  getProduct,
  updateProduct,
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
  Link2,
  Save,
  Store,
  Clock,
  DollarSign,
  Percent,
  Award,
  Search,
  RotateCcw,
  X,
  Instagram,
} from "lucide-react";
import {
  previewInstagramCaption,
  publishInstagramPost,
} from "../../../api/social";

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
  const [editingAffiliateProductId, setEditingAffiliateProductId] = useState<
    string | null
  >(null);
  const [affiliateLinkDraft, setAffiliateLinkDraft] = useState("");
  const [savingAffiliateFor, setSavingAffiliateFor] = useState<string | null>(
    null,
  );
  const [editingInstagramProductId, setEditingInstagramProductId] = useState<
    string | null
  >(null);
  const [instagramPlacement, setInstagramPlacement] = useState<"story" | "feed">(
    "story",
  );
  const [instagramImageText, setInstagramImageText] = useState("");
  const [instagramCaptionMode, setInstagramCaptionMode] = useState<"manual" | "ai">(
    "manual",
  );
  const [instagramCaptionText, setInstagramCaptionText] = useState("");
  const [publishingInstagramFor, setPublishingInstagramFor] = useState<
    string | null
  >(null);
  const [previewingCaptionFor, setPreviewingCaptionFor] = useState<
    string | null
  >(null);
  const [instagramCaptionPreview, setInstagramCaptionPreview] = useState("");
  const [instagramPromptPreview, setInstagramPromptPreview] = useState("");

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: initialStatus || "",
    store: initialStore || "",
    limit: 25,
    skip: 0,
  });
  const [total, setTotal] = useState(0);
  const currentPage = Math.floor(filters.skip / filters.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const showingFrom = total === 0 ? 0 : filters.skip + 1;
  const showingTo = Math.min(filters.skip + products.length, total);

  // Efecto para debounce de búsqueda
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm((prev) => (prev === searchTerm ? prev : searchTerm));
      setFilters((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  // Cargar productos
  const loadProducts = useCallback(async () => {
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
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearchTerm]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Ver detalle de producto
  const handleViewDetail = async (productId: string) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setDetailProduct(null);
    try {
      const product = await getProduct(productId);
      setDetailProduct(product);
    } catch (err) {
      setShowDetailModal(false);
      toast.error(
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

  // Copiar al portapapeles con toast
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`, {
      duration: 2000,
      position: "bottom-right",
      style: {
        background: "#10b981",
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        fontWeight: 500,
      },
      icon: "✅",
    });
  };

  // En la función getInstagramLink (línea 141 aprox)
  const LINKS_BASE_URL =
    import.meta.env.VITE_LINKS_BASE_URL || "https://links.descuenta.me";

  const getInstagramLink = (product: Product) => {
    const idToUse = product.id || product._id || product.product_id;
    if (!idToUse) return "#";

    const storeId = product.store?.store_id || "tienda";
    return `${LINKS_BASE_URL}/click/${idToUse}?source=instagram&campaign=${storeId}`;
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
      const actionLabel: Record<typeof action, string> = {
        publish: "publicado",
        unpublish: "despublicado",
        archive: "archivado",
      };
      toast.success(`Producto ${actionLabel[action]} exitosamente`);
    } catch (err) {
      toast.error(
        `Error: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    }
  };

  const handleOpenAffiliateEditor = (productId: string) => {
    setEditingInstagramProductId(null);
    setEditingAffiliateProductId(productId);
    setAffiliateLinkDraft("");
  };

  const hasInstagramMedia = (product: Product) =>
    Boolean(
      product.story_image_url ||
        product.feed_image_url ||
        (product.product_images && product.product_images.length > 0) ||
        product.screenshot_url,
    );

  const handleOpenInstagramEditor = (product: Product) => {
    if (!hasInstagramMedia(product)) {
      toast.error("Este producto no tiene imagen para publicar en Instagram");
      return;
    }
    setEditingAffiliateProductId(null);
    setEditingInstagramProductId(product.product_id);
    setInstagramPlacement(product.story_image_url ? "story" : "feed");
    setInstagramImageText("");
    setInstagramCaptionMode("manual");
    setInstagramCaptionText("");
    setInstagramCaptionPreview("");
    setInstagramPromptPreview("");
  };

  const handlePreviewInstagramCaption = async (product: Product) => {
    try {
      setPreviewingCaptionFor(product.product_id);
      const result = await previewInstagramCaption({
        product_id: product.product_id,
        placement: "feed",
        image_text: instagramImageText.trim() || undefined,
        feed_caption_mode: instagramCaptionMode,
        feed_caption_text: instagramCaptionText.trim() || undefined,
      });
      setInstagramCaptionPreview(result.caption || "");
      setInstagramPromptPreview(result.prompt || "");
      if (result.used_ai) {
        toast.success("Preview IA generado");
      }
    } catch (err) {
      toast.error(
        `Error generando preview: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setPreviewingCaptionFor(null);
    }
  };

  const handlePublishInstagram = async (product: Product) => {
    const imageText = instagramImageText.trim();
    if (instagramPlacement === "story" && !imageText) {
      toast.error("Ingresa el texto para la imagen en story");
      return;
    }

    try {
      setPublishingInstagramFor(product.product_id);
      const result = await publishInstagramPost({
        product_id: product.product_id,
        placement: instagramPlacement,
        image_text: imageText || undefined,
        feed_caption_mode:
          instagramPlacement === "feed"
            ? instagramCaptionMode === "ai" && instagramCaptionPreview
              ? "manual"
              : instagramCaptionMode
            : undefined,
        feed_caption_text:
          instagramPlacement === "feed"
            ? instagramCaptionMode === "ai" && instagramCaptionPreview
              ? instagramCaptionPreview
              : instagramCaptionText.trim() || undefined
            : undefined,
      });
      setEditingInstagramProductId(null);
      setInstagramImageText("");
      setInstagramCaptionText("");
      setInstagramCaptionPreview("");
      setInstagramPromptPreview("");
      toast.success(
        `Publicado en Instagram (${result.placement}) con éxito`,
      );
    } catch (err) {
      toast.error(
        `Error publicando en Instagram: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setPublishingInstagramFor(null);
    }
  };

  const handleSaveAffiliateLink = async (productId: string) => {
    const trimmedLink = affiliateLinkDraft.trim();
    if (!trimmedLink) {
      toast.error("Ingresa un link de afiliado válido");
      return;
    }

    try {
      setSavingAffiliateFor(productId);
      const updated = await updateProduct(productId, {
        link_afiliados: trimmedLink,
      });
      setProducts(
        products.map((p) => (p.product_id === productId ? updated : p)),
      );
      if (detailProduct?.product_id === productId) {
        setDetailProduct(updated);
      }
      setEditingAffiliateProductId(null);
      setAffiliateLinkDraft("");
      toast.success("Link de afiliado guardado");
    } catch (err) {
      toast.error(
        `Error al guardar link: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setSavingAffiliateFor(null);
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
      toast.success("Producto eliminado");
    } catch (err) {
      toast.error(
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
      falabella: "bg-green-200 text-green-900",
      ripley: "bg-gray-900 text-white",
      paris: "bg-sky-100 text-blue-900",
      mercadolibre: "bg-yellow-100 text-yellow-800",
    };
    return (
      colors[storeId as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getCardPriceInfo = (product: Product) => {
    if (product.store.store_id === "ripley" && product.prices.ripley_card_price) {
      return { label: "RIPLEY", value: product.prices.ripley_card_price };
    }
    if (product.store.store_id === "paris" && product.prices.cenco_card_price) {
      return { label: "CENCO", value: product.prices.cenco_card_price };
    }

    const value =
      product.prices.cmr_price ||
      product.prices.cenco_card_price ||
      product.prices.ripley_card_price ||
      product.prices.card_price;

    if (!value) return null;
    return {
      label: product.store.store_id === "paris" ? "CENCO" : "CMR",
      value,
    };
  };

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages);
    setFilters((prev) => ({
      ...prev,
      skip: (boundedPage - 1) * prev.limit,
    }));
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
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
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
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value, skip: 0 })
            }
            className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
            className="min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todas las tiendas</option>
            <option value="falabella">Falabella</option>
            <option value="ripley">Ripley</option>
            <option value="paris">Paris</option>
            <option value="mercadolibre">MercadoLibre</option>
          </select>

          <button
            onClick={loadProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            aria-busy={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <span className="self-center whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
            Total: {total} productos
            {debouncedSearchTerm && ` (mostrando ${products.length})`}
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-900">
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Precios
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Dcto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="w-14 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Creado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {products.map((product) => {
                  const cardPrice = getCardPriceInfo(product);

                  return (
                    <tr
                      key={product.product_id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      onClick={() => handleViewDetail(product.product_id)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {/* Mostrar primera imagen de product_images si existe, si no, usar feed_image_url */}
                          {product.product_images &&
                          product.product_images.length > 0 ? (
                            <img
                              src={product.product_images[0]}
                              alt={product.product_name}
                              className="w-10 h-10 object-cover rounded mr-3"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                // Si la imagen falla, intentar con feed_image_url
                                const target = e.target as HTMLImageElement;
                                if (
                                  product.feed_image_url &&
                                  target.src !== product.feed_image_url
                                ) {
                                  target.src = product.feed_image_url;
                                }
                              }}
                            />
                          ) : product.feed_image_url ? (
                            <img
                              src={product.feed_image_url}
                              alt={product.product_name}
                              className="w-10 h-10 object-cover rounded mr-3"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          ) : (
                            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                              <Image size={16} className="text-gray-400 dark:text-gray-300" />
                            </div>
                          )}
                          <div>
                            <div className="max-w-xs truncate font-medium text-gray-900 dark:text-gray-100">
                              {product.product_name}
                            </div>
                            <div
                              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>ID: {product.product_id}</span>
                              <button
                                onClick={() =>
                                  copyToClipboard(product.product_id, "ID")
                                }
                                className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400"
                                title="Copiar ID"
                              >
                                <Copy size={14} />
                              </button>
                              <span
                                className={`px-2 py-0.5 text-[10px] rounded-full ${getStoreBadge(product.store.store_id)}`}
                              >
                                {product.store.store_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {product.prices.current_price && (
                          <div className="text-sm font-medium text-red-600">
                            {product.prices.current_price}
                          </div>
                        )}
                        {product.prices.old_price && (
                          <div className="text-xs text-gray-500 line-through dark:text-gray-400">
                            {product.prices.old_price}
                          </div>
                        )}
                        {cardPrice && (
                          <div className="text-xs text-blue-600">
                            {cardPrice.label}: {cardPrice.value}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {product.prices.discount ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {product.prices.discount}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                      {product.prices.coupon && (
                        <div className="text-xs text-purple-600 mt-1">
                          🏷️ {product.prices.coupon}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(product.status)}`}
                      >
                        {product.status === "draft" && "Borrador"}
                        {product.status === "published" && "Publicado"}
                        {product.status === "archived" && "Archivado"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative inline-flex group">
                        <span className="inline-flex px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                          {product.metrics?.total_clicks ?? 0}
                        </span>
                        {product.metrics?.last_click && (
                          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                            Último click:{" "}
                            {formatDate(product.metrics.last_click)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative inline-flex group">
                        <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-[10px] leading-tight text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                          {formatShortDate(product.created_at)}
                        </span>
                        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                          {formatDate(product.created_at)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 relative">
                      <div
                        className="flex gap-2 flex-wrap"
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

                        {/* Link de afiliado - VERDE (si existe) */}
                        {product.link_afiliados && (
                          <a
                            href={product.link_afiliados}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900"
                            title="Link de afiliado"
                          >
                            <Link size={18} />
                          </a>
                        )}
                        {!product.link_afiliados && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAffiliateEditor(product.product_id);
                            }}
                            className="text-green-500 hover:text-green-700"
                            title="Agregar link afiliado"
                          >
                            <Link2 size={18} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInstagramEditor(product);
                          }}
                          className={`${
                            hasInstagramMedia(product)
                              ? "text-pink-600 hover:text-pink-800"
                              : "cursor-not-allowed text-gray-400"
                          }`}
                          title={
                            hasInstagramMedia(product)
                              ? "Publicar en Instagram"
                              : "Sin imagen para Instagram"
                          }
                          disabled={!hasInstagramMedia(product)}
                        >
                          <Instagram size={18} />
                        </button>

                        {/* Link de tienda - MORADO (si existe) */}
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
                        {product.status === "archived" && (
                          <button
                            onClick={() =>
                              handleStatusChange(product.product_id, "unpublish")
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title="Desarchivar"
                          >
                            <RotateCcw size={18} />
                          </button>
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

                      {editingAffiliateProductId === product.product_id && (
                        <div
                          className="absolute right-4 top-14 z-20 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                            Agregar link afiliado
                          </p>
                          <input
                            type="url"
                            value={affiliateLinkDraft}
                            onChange={(e) => setAffiliateLinkDraft(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingAffiliateProductId(null);
                                setAffiliateLinkDraft("");
                              }}
                              className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <X size={12} />
                              Cancelar
                            </button>
                            <button
                              onClick={() =>
                                handleSaveAffiliateLink(product.product_id)
                              }
                              disabled={savingAffiliateFor === product.product_id}
                              className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              <Save size={12} />
                              {savingAffiliateFor === product.product_id
                                ? "Guardando..."
                                : "Guardar"}
                            </button>
                          </div>
                        </div>
                      )}

                      {editingInstagramProductId === product.product_id && (
                        <div
                          className="absolute right-4 top-14 z-20 w-80 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                            Publicar en Instagram
                          </p>
                          <div className="mb-2 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setInstagramPlacement("story")}
                              className={`rounded px-2 py-1 text-xs ${
                                instagramPlacement === "story"
                                  ? "bg-pink-600 text-white"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                              }`}
                            >
                              Story
                            </button>
                            <button
                              onClick={() => setInstagramPlacement("feed")}
                              className={`rounded px-2 py-1 text-xs ${
                                instagramPlacement === "feed"
                                  ? "bg-pink-600 text-white"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                              }`}
                            >
                              Feed
                            </button>
                          </div>

                          <label className="mb-1 block text-[11px] text-gray-600 dark:text-gray-300">
                            Texto en imagen (footer)
                          </label>
                          <input
                            type="text"
                            value={instagramImageText}
                            onChange={(e) => setInstagramImageText(e.target.value)}
                            placeholder={
                              instagramPlacement === "story"
                                ? "Texto para story..."
                                : "Texto opcional en imagen..."
                            }
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-pink-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                          />

                          {instagramPlacement === "feed" && (
                            <>
                              <label className="mb-1 mt-2 block text-[11px] text-gray-600 dark:text-gray-300">
                                Caption de feed
                              </label>
                              <div className="mb-2 grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setInstagramCaptionMode("manual")}
                                  className={`rounded px-2 py-1 text-xs ${
                                    instagramCaptionMode === "manual"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  Manual
                                </button>
                                <button
                                  onClick={() => setInstagramCaptionMode("ai")}
                                  className={`rounded px-2 py-1 text-xs ${
                                    instagramCaptionMode === "ai"
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  IA (DeepSeek)
                                </button>
                              </div>
                              {instagramCaptionMode === "manual" && (
                                <textarea
                                  value={instagramCaptionText}
                                  onChange={(e) =>
                                    setInstagramCaptionText(e.target.value)
                                  }
                                  rows={2}
                                  placeholder="Texto del caption (opcional)"
                                  className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                />
                              )}
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <button
                                  onClick={() =>
                                    handlePreviewInstagramCaption(product)
                                  }
                                  disabled={
                                    previewingCaptionFor === product.product_id
                                  }
                                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                  {previewingCaptionFor === product.product_id
                                    ? "Generando preview..."
                                    : "Preview caption"}
                                </button>
                                {instagramCaptionMode === "ai" &&
                                  instagramCaptionPreview && (
                                    <span className="text-[11px] text-green-600 dark:text-green-400">
                                      Se usará este preview al publicar
                                    </span>
                                  )}
                              </div>
                              {instagramCaptionPreview && (
                                <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                  <p className="mb-1 font-semibold">
                                    Preview caption:
                                  </p>
                                  <p className="whitespace-pre-wrap">
                                    {instagramCaptionPreview}
                                  </p>
                                </div>
                              )}
                              {instagramPromptPreview &&
                                instagramCaptionMode === "ai" && (
                                  <details className="mt-2 rounded border border-gray-200 bg-white p-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                    <summary className="cursor-pointer font-medium">
                                      Ver prompt IA
                                    </summary>
                                    <p className="mt-1 whitespace-pre-wrap">
                                      {instagramPromptPreview}
                                    </p>
                                  </details>
                                )}
                            </>
                          )}

                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingInstagramProductId(null);
                                setInstagramImageText("");
                                setInstagramCaptionText("");
                              }}
                              className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              <X size={12} />
                              Cancelar
                            </button>
                            <button
                              onClick={() => handlePublishInstagram(product)}
                              disabled={publishingInstagramFor === product.product_id}
                              className="inline-flex items-center gap-1 rounded bg-pink-600 px-2 py-1 text-xs text-white hover:bg-pink-700 disabled:opacity-60"
                            >
                              <Instagram size={12} />
                              {publishingInstagramFor === product.product_id
                                ? "Publicando..."
                                : "Publicar"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Confirmación de eliminación */}
                      {showDeleteConfirm === product.product_id && (
                        <div
                          className="absolute z-10 mt-2 rounded-lg border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="mb-2 text-sm text-gray-900 dark:text-gray-100">¿Eliminar producto?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(product.product_id);
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Sí
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(null);
                              }}
                              className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {products.length === 0 && !loading && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No se encontraron productos
            </div>
          )}

          {total > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Mostrando {showingFrom}-{showingTo} de {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Siguiente
                </button>
              </div>
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
                    {getCardPriceInfo(detailProduct) && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                          <DollarSign size={16} />
                          <span>{getCardPriceInfo(detailProduct)?.label}</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {getCardPriceInfo(detailProduct)?.value}
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

                {/* Enlaces */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Enlaces
                  </h4>
                  <div className="space-y-3">
                    {/* Link del producto (URL original) */}
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

                    {/* NUEVA SECCIÓN: Link para Instagram con copia rápida */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📱</span>
                          <span className="font-medium text-gray-800">
                            Link para Instagram
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStoreBadge(
                            detailProduct.store.store_id,
                          )}`}
                        >
                          {detailProduct.store.store_name}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getInstagramLink(detailProduct)}
                          readOnly
                          className="flex-1 px-3 py-2 border border-purple-200 rounded-lg bg-white text-sm font-mono"
                        />
                        <button
                          onClick={() => {
                            copyToClipboard(
                              getInstagramLink(detailProduct),
                              "Link para Instagram",
                            );
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2"
                          title="Copiar link para Instagram"
                        >
                          <Copy size={16} />
                          <span>Copiar</span>
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                        <span>📋 Pega este link en tu:</span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Bio
                        </span>
                        <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                          Stories
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Posts
                        </span>
                        <span className="text-gray-400 ml-auto">
                          source=instagram
                        </span>
                      </div>
                    </div>

                    {/* Link de afiliado - VERDE */}
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

                    {/* Link market - MORADO */}
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
