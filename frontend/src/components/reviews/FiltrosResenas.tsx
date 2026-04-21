import { Search } from "lucide-react";

import { filtersSummary, fitDisplayLabel } from "@/lib/reviews";
import type { ReviewFilters } from "@/types/api";

export const FiltrosResenas = ({
  filters,
  total,
  onChange
}: {
  filters: ReviewFilters;
  total: number;
  onChange: (patch: Partial<ReviewFilters>) => void;
}) => (
  <section className="sticky top-20 z-20 space-y-4 rounded-[1.75rem] border border-white/60 bg-white/85 p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
        <Search size={16} className="text-slate-400" />
        <input
          value={filters.busqueda ?? ""}
          onChange={(event) => onChange({ busqueda: event.target.value })}
          placeholder="Buscar en resenas..."
          className="w-full border-none bg-transparent text-sm outline-none"
        />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-300">{filtersSummary(filters, total)}</p>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <select
        value={filters.estrellas ?? ""}
        onChange={(event) => onChange({ estrellas: event.target.value ? Number(event.target.value) : null })}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
      >
        <option value="">Todas las calificaciones</option>
        <option value="5">★★★★★</option>
        <option value="4">★★★★</option>
        <option value="3">★★★</option>
        <option value="2">★★</option>
        <option value="1">★</option>
      </select>

      <select
        value={filters.tipo ?? ""}
        onChange={(event) =>
          onChange({
            tipo: event.target.value ? (event.target.value as "fotos" | "verificadas") : null
          })
        }
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
      >
        <option value="">Todas</option>
        <option value="fotos">Solo con fotos</option>
        <option value="verificadas">Solo verificadas</option>
      </select>

      <select
        value={filters.ajuste ?? ""}
        onChange={(event) => onChange({ ajuste: event.target.value || null })}
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
      >
        <option value="">Todos los ajustes</option>
        <option value="Pequeno">{fitDisplayLabel("Pequeno")}</option>
        <option value="Exacto">{fitDisplayLabel("Exacto")}</option>
        <option value="Grande">{fitDisplayLabel("Grande")}</option>
      </select>

      <select
        value={filters.orden ?? "recientes"}
        onChange={(event) =>
          onChange({
            orden: event.target.value as "recientes" | "utiles" | "alta" | "baja"
          })
        }
        className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
      >
        <option value="recientes">Mas recientes</option>
        <option value="utiles">Mas utiles</option>
        <option value="alta">Calificacion mas alta</option>
        <option value="baja">Calificacion mas baja</option>
      </select>
    </div>
  </section>
);
