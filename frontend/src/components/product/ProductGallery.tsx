import { useEffect, useMemo, useState } from "react";

import { getVisibleProductImages } from "@/lib/utils";
import type { ProductImage } from "@/types/api";

export const ProductGallery = ({ images }: { images: ProductImage[] }) => {
  const visibleImages = useMemo(() => getVisibleProductImages(images), [images]);
  const [selectedImage, setSelectedImage] = useState(visibleImages[0]?.url ?? "");

  useEffect(() => {
    setSelectedImage(visibleImages[0]?.url ?? "");
  }, [visibleImages]);

  if (!visibleImages.length) {
    return (
      <div className="surface flex min-h-[420px] items-center justify-center p-6 text-sm font-medium text-slate-400 dark:text-slate-500">
        Este producto no tiene imagenes visibles en este momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[90px_1fr]">
      <div className="flex gap-3 overflow-x-auto lg:flex-col">
        {visibleImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedImage(image.url)}
            className={`overflow-hidden rounded-2xl border ${
              selectedImage === image.url ? "border-ember" : "border-transparent"
            }`}
          >
            <img src={image.url} alt={image.alt ?? ""} className="h-20 w-20 object-cover" />
          </button>
        ))}
      </div>
      <div className="surface overflow-hidden p-3">
        <img
          src={selectedImage}
          alt="Vista principal del producto"
          className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
        />
      </div>
    </div>
  );
};
