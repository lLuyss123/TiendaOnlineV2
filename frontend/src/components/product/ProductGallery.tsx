import { useState } from "react";

import type { ProductImage } from "@/types/api";

export const ProductGallery = ({ images }: { images: ProductImage[] }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]?.url ?? "");

  return (
    <div className="grid gap-4 lg:grid-cols-[90px_1fr]">
      <div className="flex gap-3 overflow-x-auto lg:flex-col">
        {images.map((image) => (
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
