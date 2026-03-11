import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ImageIcon,
  RefreshCw,
  Sparkles,
  Send,
  CheckSquare,
  Instagram,
  CircleDot,
  CheckCircle2,
  Archive,
} from "lucide-react";

import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import { getProducts } from "../../api/products";
import {
  previewInstagramCarouselCaption,
  publishInstagramCarousel,
  publishInstagramVideo,
} from "../../api/social";
import type { Product } from "../../types/product";

const getProductImage = (product: Product) =>
  product.feed_image_url ||
  product.story_image_url ||
  product.product_images?.[0] ||
  product.screenshot_url ||
  "";

const getCardPrices = (product: Product) => {
  const prices = product.prices || {};
  const seenValues = new Set<string>();
  const entries: Array<{ label: string; value: string }> = [];

  const addEntry = (label: string, value: string | null | undefined) => {
    const normalized = (value || "").trim();
    if (!normalized || seenValues.has(normalized)) return;
    seenValues.add(normalized);
    entries.push({ label, value: normalized });
  };

  addEntry("CMR", prices.cmr_price);
  if (prices.cenco_card_price) {
    addEntry("Cenco", prices.cenco_card_price);
  }
  if (prices.ripley_card_price) {
    addEntry("Ripley", prices.ripley_card_price);
  }
  addEntry("Tarjeta", prices.card_price);

  return entries;
};

const getStatusMeta = (status: Product["status"]) => {
  if (status === "published") {
    return {
      label: "Publicado",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      icon: CheckCircle2,
    };
  }

  if (status === "archived") {
    return {
      label: "Archivado",
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200",
      icon: Archive,
    };
  }

  return {
    label: "Borrador",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    icon: CircleDot,
  };
};

export default function IgGeneratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [store, setStore] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [captionMode, setCaptionMode] = useState<"manual" | "ai">("ai");
  const [publishMode, setPublishMode] = useState<"carousel" | "video">("carousel");
  const [captionText, setCaptionText] = useState("");
  const [extraInstruction, setExtraInstruction] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicVolume, setMusicVolume] = useState("0.15");

  const [captionPreview, setCaptionPreview] = useState("");
  const [promptPreview, setPromptPreview] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState("");
  const [previewImageStatus, setPreviewImageStatus] =
    useState<Product["status"] | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        limit: 50,
        skip: 0,
        store: store || undefined,
        search: debouncedSearch || undefined,
        sort_by: "created_at",
        sort_order: "desc",
      });
      setProducts(
        response.products.filter((product) => product.status !== "archived"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error cargando productos",
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, store]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectedProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.product_id, product]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product));
  }, [products, selectedIds]);

  const stores = useMemo(() => {
    const values = Array.from(
      new Set(products.map((product) => product.store?.store_id).filter(Boolean)),
    );
    return values.sort();
  }, [products]);

  const toggleSelection = (productId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 10) {
        toast.error("Máximo 10 productos por carrusel");
        return prev;
      }
      return [...prev, productId];
    });
  };

  const selectLatest10 = () => {
    setSelectedIds(products.slice(0, 10).map((product) => product.product_id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setCaptionPreview("");
    setPromptPreview("");
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePreview = async () => {
    if (selectedIds.length < 2) {
      toast.error("Selecciona al menos 2 productos");
      return;
    }

    setPreviewing(true);
    try {
      const response = await previewInstagramCarouselCaption({
        product_ids: selectedIds,
        caption_mode: captionMode,
        caption_text: captionMode === "manual" ? captionText.trim() : undefined,
        extra_instruction:
          captionMode === "ai" ? extraInstruction.trim() : undefined,
      });
      setCaptionPreview(response.caption || "");
      setPromptPreview(response.prompt || "");
      toast.success("Preview generado");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error generando preview",
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handlePublish = async () => {
    if (selectedIds.length < 2) {
      toast.error("Selecciona al menos 2 productos");
      return;
    }

    setPublishing(true);
    try {
      const shouldUsePreviewCaptionAsFinal =
        captionMode === "ai" && Boolean(captionPreview.trim());

      const payload = {
        ...(publishMode === "video" && musicVolume.trim()
          ? (() => {
              const parsed = Number(musicVolume);
              return Number.isFinite(parsed)
                ? { music_volume: parsed }
                : {};
            })()
          : {}),
        product_ids: selectedIds,
        caption_mode: shouldUsePreviewCaptionAsFinal ? "manual" : captionMode,
        caption_text: shouldUsePreviewCaptionAsFinal
          ? captionPreview.trim()
          : captionMode === "manual"
            ? captionText.trim()
            : undefined,
        extra_instruction:
          shouldUsePreviewCaptionAsFinal
            ? undefined
            : captionMode === "ai"
              ? extraInstruction.trim()
              : undefined,
        ...(publishMode === "video"
          ? {
              music_url: musicUrl.trim() || undefined,
            }
          : {}),
      };
      const response =
        publishMode === "video"
          ? await publishInstagramVideo(payload)
          : await publishInstagramCarousel(payload);
      setCaptionPreview(response.caption || "");
      setPromptPreview(response.prompt || "");
      toast.success(
        publishMode === "video"
          ? `Video publicado (${response.items_count} ítems)`
          : `Carrusel publicado (${response.items_count} ítems)`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : publishMode === "video"
            ? "Error publicando video"
            : "Error publicando carrusel",
      );
    } finally {
      setPublishing(false);
      setShowPublishConfirm(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Descuenta.me | Generador de Carruseles"
        description="Generador autenticado de carruseles para Instagram con selección de productos y caption asistido por IA."
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <Instagram size={20} />
              Generador de Carruseles
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={selectLatest10}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Últimos 10
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <select
              value={store}
              onChange={(event) => setStore(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            >
              <option value="">Todas las tiendas</option>
              {stores.map((storeId) => (
                <option key={storeId} value={storeId}>
                  {storeId}
                </option>
              ))}
            </select>
            <div className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">
              Seleccionados: {selectedIds.length}/10
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Productos publicados
              </h2>
              <button
                onClick={clearSelection}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Limpiar selección
              </button>
            </div>

            <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
              {loading ? (
                <p className="text-sm text-gray-500">Cargando productos...</p>
              ) : (
                products.map((product) => {
                  const checked = selectedIds.includes(product.product_id);
                  const imageUrl = getProductImage(product);
                  return (
                    <button
                      type="button"
                      key={product.product_id}
                      onClick={() => toggleSelection(product.product_id)}
                      className={`group flex w-full items-start gap-2 overflow-hidden rounded-xl border p-1.5 text-left transition sm:items-center sm:gap-3 sm:p-2 ${
                        checked
                          ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-500/10"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-brand-600 sm:mt-0 dark:border-gray-700 dark:bg-gray-900">
                        {checked ? <CheckSquare size={14} /> : null}
                      </div>
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 sm:h-14 sm:w-14 dark:border-gray-700 dark:bg-gray-800">
                        <div className="absolute right-1 top-1 z-10 sm:hidden">
                          {(() => {
                            const statusMeta = getStatusMeta(product.status);
                            const StatusIcon = statusMeta.icon;
                            return (
                              <button
                                type="button"
                                title={statusMeta.label}
                                aria-label={statusMeta.label}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPreviewImageUrl(imageUrl);
                                  setPreviewImageName(product.product_name);
                                  setPreviewImageStatus(product.status);
                                }}
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/80 shadow-sm ${statusMeta.className}`}
                              >
                                <StatusIcon size={11} />
                              </button>
                            );
                          })()}
                        </div>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.product_name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPreviewImageUrl(imageUrl);
                              setPreviewImageName(product.product_name);
                              setPreviewImageStatus(product.status);
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ImageIcon size={14} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="max-h-8 overflow-hidden break-words text-[13px] font-medium leading-4 text-gray-900 sm:max-h-none sm:text-sm sm:leading-5 sm:truncate dark:text-gray-100">
                          {product.product_name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] sm:mt-0.5 sm:gap-1.5 sm:text-xs">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {product.prices.current_price || "-"}
                          </span>
                          {product.prices.old_price && (
                            <span className="text-gray-400 line-through dark:text-gray-500">
                              {product.prices.old_price}
                            </span>
                          )}
                          {product.prices.discount && (
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                              -{product.prices.discount}%
                            </span>
                          )}
                          {product.prices.coupon && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              Cupón
                            </span>
                          )}
                          <span className="max-w-[86px] truncate text-gray-500 sm:max-w-none dark:text-gray-400">
                            {product.store?.store_name || product.store?.store_id}
                          </span>
                        </div>
                        {getCardPrices(product).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px] sm:text-[11px]">
                            {getCardPrices(product).map((card) => (
                              <span
                                key={`${product.product_id}-${card.label}-${card.value}`}
                                className="max-w-full truncate rounded bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
                              >
                                {card.label}: {card.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="hidden flex-shrink-0 sm:block">
                        {(() => {
                          const statusMeta = getStatusMeta(product.status);
                          const StatusIcon = statusMeta.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                            >
                              <StatusIcon size={12} />
                              {statusMeta.label}
                            </span>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Configuración de publicación
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Formato
                </label>
                <div className="inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-700">
                  <button
                    onClick={() => setPublishMode("carousel")}
                    className={`rounded-md px-3 py-1.5 text-sm ${publishMode === "carousel" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    Carrusel
                  </button>
                  <button
                    onClick={() => setPublishMode("video")}
                    className={`rounded-md px-3 py-1.5 text-sm ${publishMode === "video" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    Video
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Caption
                </label>
                <div className="inline-flex rounded-lg border border-gray-300 p-1 dark:border-gray-700">
                  <button
                    onClick={() => setCaptionMode("ai")}
                    className={`rounded-md px-3 py-1.5 text-sm ${captionMode === "ai" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    IA DeepSeek
                  </button>
                  <button
                    onClick={() => setCaptionMode("manual")}
                    className={`rounded-md px-3 py-1.5 text-sm ${captionMode === "manual" ? "bg-brand-500 text-white" : "text-gray-600 dark:text-gray-300"}`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {captionMode === "manual" ? (
                <textarea
                  value={captionText}
                  onChange={(event) => setCaptionText(event.target.value)}
                  className="h-28 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  placeholder="Escribe el caption manual..."
                />
              ) : (
                <textarea
                  value={extraInstruction}
                  onChange={(event) => setExtraInstruction(event.target.value)}
                  className="h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                  placeholder="Instrucción opcional para la IA (tono, foco, etc.)"
                />
              )}

              {publishMode === "video" && (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Música (opcional)
                  </p>
                  <input
                    value={musicUrl}
                    onChange={(event) => setMusicUrl(event.target.value)}
                    placeholder="https://.../track.mp3"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-300">
                      Volumen
                    </label>
                    <input
                      value={musicVolume}
                      onChange={(event) => setMusicVolume(event.target.value)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      0.0 a 2.0
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePreview}
                  disabled={previewing || selectedIds.length < 2}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  <Sparkles size={14} />
                  {previewing ? "Generando..." : "Preview caption"}
                </button>
                <button
                  onClick={() => {
                    if (selectedIds.length < 2) {
                      toast.error("Selecciona al menos 2 productos");
                      return;
                    }
                    setShowPublishConfirm(true);
                  }}
                  disabled={publishing || selectedIds.length < 2}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={14} />
                  {publishing
                    ? "Publicando..."
                    : publishMode === "video"
                      ? "Publicar video"
                      : "Publicar carrusel"}
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Preview caption
                </p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {captionPreview || "Aún no hay preview."}
                </pre>
              </div>

              {promptPreview && captionMode === "ai" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Prompt IA usado
                  </p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                    {promptPreview}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Orden del carrusel ({selectedProducts.length} ítems)
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
                >
                  <span className="mr-2 text-xs font-semibold text-brand-500">
                    #{index + 1}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {product.product_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(previewImageUrl)}
        onClose={() => {
          setPreviewImageUrl(null);
          setPreviewImageStatus(null);
        }}
        className="mx-3 max-h-[90vh] max-w-[1200px] overflow-hidden p-0"
      >
        <div className="flex max-h-[90vh] flex-col bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2 pr-10">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {previewImageName || "Preview imagen"}
              </p>
              {previewImageStatus && (
                (() => {
                  const statusMeta = getStatusMeta(previewImageStatus);
                  const StatusIcon = statusMeta.icon;
                  return (
                    <span
                      className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                    >
                      <StatusIcon size={12} />
                      {statusMeta.label}
                    </span>
                  );
                })()
              )}
            </div>
          </div>
          <div className="flex items-center justify-center bg-gray-50 p-3 dark:bg-gray-950">
            {previewImageUrl && (
              <img
                src={previewImageUrl}
                alt={previewImageName || "Preview"}
                className="max-h-[78vh] w-auto max-w-full object-contain"
              />
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPublishConfirm}
        onClose={() => {
          if (!publishing) setShowPublishConfirm(false);
        }}
        className="mx-3 w-full max-w-md p-0"
      >
        <div className="rounded-2xl bg-white p-5 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {publishMode === "video"
              ? "¿Publicar video en Instagram?"
              : "¿Publicar carrusel en Instagram?"}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {publishMode === "video"
              ? `Se generará un video con ${selectedIds.length} productos en el orden seleccionado.`
              : `Se publicarán ${selectedIds.length} productos en el orden seleccionado.`}
          </p>
          <div className="mt-4 max-h-36 space-y-1 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-800 dark:bg-gray-950">
            {selectedProducts.map((product, index) => (
              <p key={product.product_id} className="truncate text-gray-700 dark:text-gray-300">
                {index + 1}. {product.product_name}
              </p>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowPublishConfirm(false)}
              disabled={publishing}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing
                ? "Publicando..."
                : publishMode === "video"
                  ? "Publicar video"
                  : "Publicar ahora"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
