// components/ProductImage.tsx
import { useState } from "react";
import { Image } from "lucide-react";

interface ProductImageProps {
  primarySrc?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

export default function ProductImage({
  primarySrc,
  fallbackSrc,
  alt,
  className = "w-10 h-10 object-cover rounded mr-3",
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(primarySrc);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Si no hay imágenes, mostrar placeholder
  if (!primarySrc && !fallbackSrc) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
      >
        <Image size={16} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Skeleton mientras carga */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      <img
        src={error && fallbackSrc ? fallbackSrc : imgSrc}
        alt={alt}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (!error && fallbackSrc && fallbackSrc !== imgSrc) {
            // Intentar con fallback
            setImgSrc(fallbackSrc);
            setError(true);
          } else {
            // Si todo falla, mostrar placeholder
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            setLoaded(false);
          }
        }}
      />
    </div>
  );
}
