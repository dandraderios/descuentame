import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface ProductImageProps {
  primarySrc?: string;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  priority?: boolean; // ← AGREGAR ESTA LÍNEA
}

export default function ProductImage({
  primarySrc,
  fallbackSrc,
  alt,
  className = "w-10 h-10 object-cover rounded mr-3",
  priority = false, // ← VALOR POR DEFECTO
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(primarySrc);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Determinar la fuente final
  const getSrc = () => {
    if (error && fallbackSrc) return fallbackSrc;
    return imgSrc;
  };

  const hasImages = primarySrc || fallbackSrc;

  if (!hasImages) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
      >
        <ImageIcon size={16} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      <img
        src={getSrc()}
        alt={alt}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        loading={priority ? "eager" : "lazy"} // ← AHORA USA priority
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (!error && fallbackSrc && fallbackSrc !== imgSrc) {
            setImgSrc(fallbackSrc);
            setError(true);
          } else {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            setLoaded(false);
          }
        }}
      />
    </div>
  );
}
