import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { EstrellasPuntuacion } from "@/components/reviews/EstrellasPuntuacion";
import { LoadingState } from "@/components/ui/LoadingState";
import { dateTime, relativeTime } from "@/lib/utils";
import { adminService } from "@/services/admin";

export const AdminReviewsPage = () => {
  const [filters, setFilters] = useState({
    producto: "",
    calificacion: "",
    verificado: "",
    reportadas: "",
    respuesta: ""
  });
  const [draftReplies, setDraftReplies] = useState<Record<string, string>>({});
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews", params.toString()],
    queryFn: () => adminService.listReviews(params)
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, contenido, hasReply }: { reviewId: string; contenido: string; hasReply: boolean }) =>
      hasReply
        ? adminService.updateReviewReply(reviewId, contenido)
        : adminService.createReviewReply(reviewId, contenido),
    onSuccess: async () => {
      await reviewsQuery.refetch();
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (reviewId: string) => adminService.verifyReview(reviewId),
    onSuccess: async () => {
      await reviewsQuery.refetch();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => adminService.deleteReview(reviewId),
    onSuccess: async () => {
      await reviewsQuery.refetch();
    }
  });

  if (reviewsQuery.isLoading) {
    return <LoadingState label="Cargando resenas..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Resenas</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Moderacion y respuesta
        </h1>
      </section>

      <section className="surface grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={filters.producto}
          onChange={(event) => setFilters((current) => ({ ...current, producto: event.target.value }))}
          placeholder="Buscar producto"
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
        />
        <select
          value={filters.calificacion}
          onChange={(event) => setFilters((current) => ({ ...current, calificacion: event.target.value }))}
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Calificacion</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} estrellas
            </option>
          ))}
        </select>
        <select
          value={filters.verificado}
          onChange={(event) => setFilters((current) => ({ ...current, verificado: event.target.value }))}
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Verificacion</option>
          <option value="true">Verificadas</option>
          <option value="false">No verificadas</option>
        </select>
        <select
          value={filters.reportadas}
          onChange={(event) => setFilters((current) => ({ ...current, reportadas: event.target.value }))}
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Reportes</option>
          <option value="true">Con reportes</option>
          <option value="false">Sin reportes</option>
        </select>
        <select
          value={filters.respuesta}
          onChange={(event) => setFilters((current) => ({ ...current, respuesta: event.target.value }))}
          className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Respuesta</option>
          <option value="true">Con respuesta</option>
          <option value="false">Sin respuesta</option>
        </select>
      </section>

      <div className="space-y-4">
        {reviewsQuery.data?.items.map((review) => (
          <article key={review.id} className="surface space-y-5 p-6">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">
                    {review.product.nombre}
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    {review.usuario?.nombre ?? "Cliente"}
                  </span>
                  {review.verificado ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Verificada
                    </span>
                  ) : null}
                  {review.reportCount > 0 ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      {review.reportCount} reportes
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <EstrellasPuntuacion value={review.calificacion} />
                  <span className="text-sm text-slate-500 dark:text-slate-300" title={dateTime(review.createdAt)}>
                    {relativeTime(review.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{review.titulo}</h2>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{review.comentario}</p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={draftReplies[review.id] ?? review.respuesta?.contenido ?? ""}
                  onChange={(event) =>
                    setDraftReplies((current) => ({ ...current, [review.id]: event.target.value }))
                  }
                  placeholder="Responder publicamente a la resena"
                  className="min-h-[140px] w-full rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-4 text-sm outline-none dark:border-white/10 dark:bg-white/5"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                    onClick={() =>
                      replyMutation.mutate({
                        reviewId: review.id,
                        contenido: draftReplies[review.id] ?? review.respuesta?.contenido ?? "",
                        hasReply: Boolean(review.respuesta)
                      })
                    }
                  >
                    {review.respuesta ? "Actualizar respuesta" : "Responder"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200"
                    onClick={() => verifyMutation.mutate(review.id)}
                  >
                    Marcar verificada
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
                    onClick={() => {
                      if (window.confirm("Quieres eliminar esta resena?")) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
