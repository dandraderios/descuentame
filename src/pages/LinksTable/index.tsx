import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link as LinkIcon,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ChevronsDown,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { getProducts } from "../../api/products";
import type { Product } from "../../types/product";

const toDisplayText = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number") {
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : "-";
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const preferredKeys = ["formatted", "price", "amount", "value", "text"];

    for (const key of preferredKeys) {
      const candidate = objectValue[key];
      if (typeof candidate === "string" || typeof candidate === "number") {
        const text = String(candidate).trim();
        if (text.length > 0) return text;
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "-";
    }
  }

  return String(value);
};

const truncateAtWord = (value: unknown, maxChars = 40) => {
  const text = toDisplayText(value);
  if (text === "-" || text.length <= maxChars) return text;

  const sliced = text.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace <= 0) return sliced.trim();

  return sliced.slice(0, lastSpace).trim();
};

const getCardPriceInfo = (product: Product) => {
  const ripleyPrice = toDisplayText(product.prices.ripley_card_price);
  if (product.store.store_id === "ripley" && ripleyPrice !== "-") {
    return { label: "Ripley", value: ripleyPrice };
  }

  const cencoPrice = toDisplayText(product.prices.cenco_card_price);
  if (product.store.store_id === "paris" && cencoPrice !== "-") {
    return { label: "Cenco", value: cencoPrice };
  }

  const cmrPrice = toDisplayText(product.prices.cmr_price);
  if (cmrPrice !== "-") {
    return { label: "Tarjeta", value: cmrPrice };
  }

  const cardPrice = toDisplayText(product.prices.card_price);
  if (cardPrice === "-") return null;

  return { label: "Tarjeta", value: cardPrice };
};

const getProductImage = (product: Product) =>
  product.product_images?.[0] ||
  product.feed_image_url ||
  product.story_image_url ||
  null;

const LazyProductImage = ({
  src,
  alt,
  className,
  placeholderClassName,
}: {
  src: string | null;
  alt: string;
  className: string;
  placeholderClassName: string;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src || !containerRef.current || shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldLoad, src]);

  return (
    <div ref={containerRef} className="relative">
      {src && shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {!loaded && (
        <div className={`${placeholderClassName} animate-pulse`} />
      )}
    </div>
  );
};

const LINKS_BASE_URL =
  import.meta.env.VITE_LINKS_BASE_URL || "https://links.descuenta.me";
const PAGE_SIZE = 10;

const getProductLink = (product: Product) => {
  const idToUse = product.id || product._id || product.product_id;
  if (!idToUse) return "#";

  const storeId = product.store?.store_id || "tienda";
  return `${LINKS_BASE_URL}/click/${idToUse}?source=website&campaign=${storeId}`;
};

type BooleanFilter = "all" | "yes" | "no";

export default function LinksTablePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<Product[]>([]);
  const totalRef = useRef(0);
  const inFlightRef = useRef(false);
  const tickingRef = useRef(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [discountFilter, setDiscountFilter] = useState<BooleanFilter>("all");
  const [couponFilter, setCouponFilter] = useState<BooleanFilter>("all");
  const [cardFilter, setCardFilter] = useState<BooleanFilter>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasMore = products.length < total;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  const loadPublishedProducts = useCallback(async (reset = false) => {
    if (inFlightRef.current) return;
    if (!reset && productsRef.current.length >= totalRef.current) return;

    inFlightRef.current = true;
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getProducts({
        status: "published",
        limit: PAGE_SIZE,
        skip: reset ? 0 : productsRef.current.length,
        store: storeFilter || undefined,
        search: debouncedSearch || undefined,
        sort_by: "updated_at",
        sort_order: "desc",
      });
      const nextProducts = reset
        ? response.products
        : [...productsRef.current, ...response.products];
      productsRef.current = nextProducts;
      totalRef.current = response.total;
      setProducts(nextProducts);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar productos",
      );
    } finally {
      inFlightRef.current = false;
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, storeFilter]);

  useEffect(() => {
    loadPublishedProducts(true);
  }, [loadPublishedProducts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadPublishedProducts(false);
        }
      },
      { rootMargin: "250px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadPublishedProducts]);

  const tryLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const target = loadMoreRef.current;
    if (!target || inFlightRef.current) return;

    const rect = target.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 120) {
      void loadPublishedProducts(false);
    }
  }, [hasMore, loading, loadingMore, loadPublishedProducts]);

  useEffect(() => {
    tryLoadMore();
  }, [products.length, total, tryLoadMore]);

  useEffect(() => {
    const onScrollOrResize = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        tryLoadMore();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [tryLoadMore]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const hasDiscount = toDisplayText(product.prices.discount) !== "-";
      const hasCoupon = toDisplayText(product.prices.coupon) !== "-";
      const hasCard = Boolean(getCardPriceInfo(product));

      if (discountFilter === "yes" && !hasDiscount) return false;
      if (discountFilter === "no" && hasDiscount) return false;

      if (couponFilter === "yes" && !hasCoupon) return false;
      if (couponFilter === "no" && hasCoupon) return false;

      if (cardFilter === "yes" && !hasCard) return false;
      if (cardFilter === "no" && hasCard) return false;

      return true;
    });
  }, [products, discountFilter, couponFilter, cardFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (storeFilter) count += 1;
    if (discountFilter !== "all") count += 1;
    if (couponFilter !== "all") count += 1;
    if (cardFilter !== "all") count += 1;
    return count;
  }, [search, storeFilter, discountFilter, couponFilter, cardFilter]);

  return (
    <>
      <PageMeta
        title="Links Table | Productos Publicados"
        description="Tabla de productos publicados con filtros"
      />

      <main className="min-h-screen bg-gray-50 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <section className="mx-auto w-full max-w-none">
          <div className="mb-4 rounded-2xl bg-black p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/images/logo/descuentame-logo-light.png"
                  alt="Descuenta.me"
                  className="h-8 w-auto sm:h-9"
                />
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white sm:text-sm">
                  {loading
                    ? "Cargando..."
                    : `${filteredProducts.length} visibles (${products.length}/${total})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFiltersOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20 lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  Filtrar
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs text-black">
                      {activeFiltersCount}
                    </span>
                  )}
                  {mobileFiltersOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                <button
                  onClick={async () => {
                    await loadPublishedProducts(true);
                    window.requestAnimationFrame(() => {
                      tryLoadMore();
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  <RefreshCw size={14} />
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div
            className={`mb-4 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 ${
              mobileFiltersOpen ? "block" : "hidden"
            } lg:block`}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, ID, SKU o marca"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />

              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="">Todas las tiendas</option>
                <option value="falabella">Falabella</option>
                <option value="ripley">Ripley</option>
                <option value="paris">Paris</option>
                <option value="mercadolibre">MercadoLibre</option>
              </select>

              <select
                value={discountFilter}
                onChange={(e) =>
                  setDiscountFilter(e.target.value as BooleanFilter)
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="all">Descuento: Todos</option>
                <option value="yes">Con descuento</option>
                <option value="no">Sin descuento</option>
              </select>

              <select
                value={couponFilter}
                onChange={(e) =>
                  setCouponFilter(e.target.value as BooleanFilter)
                }
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="all">Cupón: Todos</option>
                <option value="yes">Con cupón</option>
                <option value="no">Sin cupón</option>
              </select>

              <select
                value={cardFilter}
                onChange={(e) => setCardFilter(e.target.value as BooleanFilter)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="all">Pago tarjeta: Todos</option>
                <option value="yes">Con pago tarjeta</option>
                <option value="no">Sin pago tarjeta</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div>
              <table className="w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loading &&
                    Array.from({ length: 8 }).map((_, index) => (
                      <tr key={`loading-row-${index}`}>
                        <td className="px-3 py-2.5">
                          <div className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
                        </td>
                      </tr>
                    ))}

                  {!loading &&
                    filteredProducts.map((product) => {
                      const productName = toDisplayText(product.product_name);
                      const shortProductName = truncateAtWord(productName, 40);
                      const image = getProductImage(product);
                      const cardPrice = getCardPriceInfo(product);
                      const productLink = getProductLink(product);

                      return (
                        <tr
                          key={toDisplayText(product.product_id)}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex min-w-0 items-start gap-3">
                              <LazyProductImage
                                src={image}
                                alt={productName}
                                className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                                placeholderClassName="h-16 w-16 shrink-0 rounded-xl bg-gray-100 sm:h-20 sm:w-20"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="md:flex md:items-start md:justify-between md:gap-3">
                                  <p className="text-sm font-medium text-gray-800 md:pt-1">
                                    {shortProductName}
                                  </p>
                                  <div className="mt-1 hidden flex-wrap justify-end gap-2 md:flex">
                                    <span className="rounded-full bg-error-50 px-3 py-1 text-sm font-semibold text-error-700">
                                      {toDisplayText(
                                        product.prices.current_price,
                                      )}
                                    </span>
                                    {toDisplayText(product.prices.old_price) !==
                                      "-" && (
                                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500 line-through">
                                        {toDisplayText(product.prices.old_price)}
                                      </span>
                                    )}
                                    {toDisplayText(product.prices.discount) !==
                                      "-" && (
                                      <span className="rounded-full bg-success-100 px-3 py-1 text-sm font-medium text-success-700">
                                        {toDisplayText(product.prices.discount)}%
                                        OFF
                                      </span>
                                    )}
                                    {toDisplayText(product.prices.coupon) !==
                                      "-" && (
                                      <span className="rounded-full bg-warning-100 px-3 py-1 text-sm font-medium text-warning-700">
                                        Cupón:{" "}
                                        {toDisplayText(product.prices.coupon)}
                                      </span>
                                    )}
                                    {cardPrice && (
                                      <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-700">
                                        {cardPrice.label}: {cardPrice.value}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div className="flex flex-wrap gap-1.5 md:hidden">
                                    <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-700">
                                      {toDisplayText(
                                        product.prices.current_price,
                                      )}
                                    </span>
                                    {toDisplayText(product.prices.old_price) !==
                                      "-" && (
                                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 line-through">
                                        {toDisplayText(product.prices.old_price)}
                                      </span>
                                    )}
                                    {toDisplayText(product.prices.discount) !==
                                      "-" && (
                                      <span className="rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-medium text-success-700">
                                        {toDisplayText(product.prices.discount)}%
                                        OFF
                                      </span>
                                    )}
                                    {toDisplayText(product.prices.coupon) !==
                                      "-" && (
                                      <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-warning-700">
                                        Cupón:{" "}
                                        {toDisplayText(product.prices.coupon)}
                                      </span>
                                    )}
                                    {cardPrice && (
                                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                                        {cardPrice.label}: {cardPrice.value}
                                      </span>
                                    )}
                                  </div>
                                  <a
                                    href={productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 self-start rounded-xl bg-black px-2.5 py-1.5 text-xs font-semibold text-[#61ffe3] shadow-theme-sm hover:opacity-90 md:self-auto"
                                    title="Abrir link"
                                  >
                                    <LinkIcon size={18} />
                                    Link
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {!loading && (
              <div ref={loadMoreRef} className="border-t border-gray-100 px-4 py-4 text-center">
                {loadingMore ? (
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw size={16} className="animate-spin" />
                    Cargando más productos...
                  </div>
                ) : hasMore ? (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                    <ChevronsDown size={18} className="animate-bounce" />
                    Sigue haciendo scroll para cargar más
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    No hay más productos para cargar
                  </div>
                )}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-gray-500">
                No hay productos para los filtros seleccionados.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
