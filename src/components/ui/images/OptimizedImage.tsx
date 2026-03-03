// components/OptimizedImage.tsx
import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean; // Para imágenes que deben cargarse inmediato
  onError?: () => void;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = "w-10 h-10 object-cover rounded",
  fallbackSrc,
  priority = false,
  onError,
  onLoad,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Intersection Observer para lazy loading (solo si no es priority)
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Cargar 200px antes de ser visible
        threshold: 0.01,
      },
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Manejar error de carga
  const handleError = () => {
    if (!error && fallbackSrc && fallbackSrc !== imgSrc) {
      // Intentar con fallback
      setImgSrc(fallbackSrc);
      setError(true);
    } else {
      // Si no hay fallback o ya falló, mostrar placeholder
      setIsLoading(false);
      onError?.();
    }
  };

  // Manejar carga exitosa
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Si no hay imagen, mostrar placeholder directamente
  if (!src && !fallbackSrc) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
      >
        <ImageIcon size={16} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative ${className} overflow-hidden bg-gray-100`}
      style={{ minHeight: "40px" }} // Evitar layout shift
    >
      {/* Skeleton loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
      )}

      {/* Imagen (solo si es visible o priority) */}
      {(isVisible || priority) && (
        <img
          src={imgSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
