import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { lookbookScenes } from "@/data/marketing";
import { shopService } from "@/services/shop";

export const LookbookPage = () => {
  const productsQuery = useQuery({
    queryKey: ["lookbook-products"],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: "6" });
      return shopService.listProducts(params);
    }
  });

  return (
    <div className="page-shell space-y-10">
      <SectionHeading
        eyebrow="Lookbook"
        title="Outfits comprables"
        description="Una galería editorial donde cada escena se conecta con productos reales del catálogo."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {lookbookScenes.map((scene) => (
          <article key={scene.title} className="surface overflow-hidden">
            <img src={scene.image} alt={scene.title} className="aspect-[4/5] w-full object-cover" />
            <div className="space-y-3 p-6">
              <h2 className="font-display text-4xl uppercase text-slate-950 dark:text-white">
                {scene.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{scene.description}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {productsQuery.data?.items.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
