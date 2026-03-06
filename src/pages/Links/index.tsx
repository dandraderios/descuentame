import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ChevronsDown } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { getProducts } from "../../api/products";
import type { Product } from "../../types/product";

const getCardPriceInfo = (product: Product) => {
  if (product.store.store_id === "ripley" && product.prices.ripley_card_price) {
    return { label: "Pago Ripley", value: product.prices.ripley_card_price };
  }

  if (product.store.store_id === "paris" && product.prices.cenco_card_price) {
    return { label: "Pago Cenco", value: product.prices.cenco_card_price };
  }

  if (product.prices.cmr_price) {
    return { label: "Pago CMR", value: product.prices.cmr_price };
  }

  if (product.prices.card_price) {
    return { label: "Pago Tarjeta", value: product.prices.card_price };
  }

  return null;
};

const getProductImage = (product: Product) =>
  product.product_images?.[0] ||
  product.feed_image_url ||
  product.story_image_url ||
  null;

const LazyProductImage = ({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
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
    <div ref={containerRef} className="relative aspect-square w-full overflow-hidden">
      {src && shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={`aspect-square w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-100" />
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

export default function LinksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const productsRef = useRef<Product[]>([]);
  const totalRef = useRef(0);
  const inFlightRef = useRef(false);

  const hasMore = products.length < total;

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

    const skip = reset ? 0 : productsRef.current.length;
    try {
      const response = await getProducts({
        status: "published",
        limit: PAGE_SIZE,
        skip,
        sort_by: "updated_at",
        sort_order: "desc",
      });

      setProducts((prev) =>
        reset ? response.products : [...prev, ...response.products],
      );
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
  }, []);

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

  const headerText = useMemo(() => {
    if (loading) return "Cargando productos...";
    if (error) return "Error al cargar productos";
    return `${products.length} / ${total} productos publicados`;
  }, [loading, error, products.length, total]);

  return (
    <>
      <PageMeta
        title="Links | Productos Publicados"
        description="Listado de últimos productos publicados"
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
                  {headerText}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadPublishedProducts(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  <RefreshCw size={14} />
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                >
                  <div className="aspect-square w-full animate-pulse bg-gray-200" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => {
                const image = getProductImage(product);
                const cardPrice = getCardPriceInfo(product);
                const productLink = getProductLink(product);

                return (
                  <article
                    key={product.product_id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <a
                      href={productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border-b border-gray-100"
                    >
                      <LazyProductImage src={image} alt={product.product_name} />
                    </a>

                    <div className="space-y-2 p-3">
                      <p className="line-clamp-2 text-xs font-medium text-gray-700">
                        {product.product_name}
                      </p>

                      <div className="flex items-center gap-2">
                        {product.prices.current_price && (
                          <span className="text-sm font-semibold text-error-600">
                            {product.prices.current_price}
                          </span>
                        )}
                        {product.prices.old_price && (
                          <span className="text-[11px] text-gray-400 line-through">
                            {product.prices.old_price}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {product.prices.discount && (
                          <span className="rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700">
                            {product.prices.discount}% OFF
                          </span>
                        )}
                        {product.prices.coupon && (
                          <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-medium text-warning-700">
                            Cupón: {product.prices.coupon}
                          </span>
                        )}
                        {cardPrice && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                            {cardPrice.label}: {cardPrice.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && (
            <div ref={loadMoreRef} className="py-6 text-center">
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
        </section>
      </main>
    </>
  );
}
