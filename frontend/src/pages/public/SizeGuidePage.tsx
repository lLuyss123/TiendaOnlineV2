import { sizeGuide } from "@/data/marketing";

export const SizeGuidePage = () => (
  <div className="page-shell space-y-8">
    <section className="surface space-y-4 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Guía de tallas</p>
      <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
        Medidas por marca
      </h1>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Tablas rápidas para decidir con más confianza antes de ir al checkout.
      </p>
    </section>
    <div className="grid gap-5 md:grid-cols-3">
      {sizeGuide.map((guide) => (
        <div key={`${guide.brand}-${guide.category}`} className="surface space-y-4 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-ember">{guide.brand}</p>
          <h2 className="font-display text-4xl uppercase text-slate-950 dark:text-white">
            {guide.category}
          </h2>
          <div className="flex flex-wrap gap-2">
            {guide.sizes.map((size) => (
              <span
                key={size}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-white/10"
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
