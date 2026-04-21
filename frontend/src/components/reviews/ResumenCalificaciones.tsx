import { motion } from "framer-motion";

import type { ReviewSummary } from "@/types/api";

import { EstrellasPuntuacion } from "./EstrellasPuntuacion";

const barPalette = {
  5: "bg-emerald-500",
  4: "bg-emerald-400",
  3: "bg-amber-400",
  2: "bg-orange-400",
  1: "bg-red-500"
} as const;

export const ResumenCalificaciones = ({
  summary,
  selectedStar,
  onFiltrarEstrella
}: {
  summary: ReviewSummary | null;
  selectedStar: number | null;
  onFiltrarEstrella: (star: number | null) => void;
}) => {
  if (!summary) {
    return null;
  }

  return (
    <section className="surface space-y-6 p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">
            Resumen de calificaciones
          </p>
          <div className="flex items-end gap-4">
            <span className="font-display text-7xl leading-none text-slate-950 dark:text-white">
              {summary.promedioCalificacion.toFixed(1)}
            </span>
            <div className="space-y-2 pb-2">
              <EstrellasPuntuacion value={summary.promedioCalificacion} size="lg" />
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Basado en {summary.totalResenas} resenas
              </p>
            </div>
          </div>
          {summary.majorityVerified ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Compra verificada
            </span>
          ) : null}
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribucion[star as 1 | 2 | 3 | 4 | 5];
            const percent = summary.totalResenas > 0 ? Math.round((count / summary.totalResenas) * 100) : 0;
            const isActive = selectedStar === star;

            return (
              <button
                key={star}
                type="button"
                className={`grid w-full grid-cols-[58px_1fr_52px] items-center gap-3 rounded-2xl px-3 py-2 text-left transition ${
                  isActive ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "hover:bg-slate-100/80 dark:hover:bg-white/10"
                }`}
                onClick={() => onFiltrarEstrella(isActive ? null : star)}
              >
                <span className="text-sm font-semibold">
                  {star} {"\u2605"}
                </span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, delay: 0.05 * (5 - star) }}
                    className={`h-full rounded-full ${barPalette[star as keyof typeof barPalette]}`}
                  />
                </div>
                <span className="text-right text-sm font-medium">{percent}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 p-5 md:grid-cols-2 dark:border-white/10">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
            Ajuste de talla
          </p>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
            <span>Pequeno</span>
            <div className="relative h-2 flex-1 rounded-full bg-slate-200 dark:bg-white/10">
              {summary.ajustePromedio !== null ? (
                <span
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-ember shadow"
                  style={{ left: `calc(${summary.ajustePromedio}% - 8px)` }}
                />
              ) : null}
            </div>
            <span>Grande</span>
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {summary.ajusteEtiqueta ? `Promedio: ${summary.ajusteEtiqueta}` : "Aun no hay suficientes datos"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
            Comodidad
          </p>
          {summary.comodidadPromedio !== null ? (
            <div className="flex items-center gap-3">
              <EstrellasPuntuacion value={summary.comodidadPromedio} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {summary.comodidadPromedio.toFixed(1)} / 5
              </span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Aun no hay suficientes respuestas sobre comodidad.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
