import { useMutation, useQuery } from "@tanstack/react-query";

import { EstrellasPuntuacion } from "@/components/reviews/EstrellasPuntuacion";
import { LoadingState } from "@/components/ui/LoadingState";
import { adminService } from "@/services/admin";

export const AdminReportedReviewsPage = () => {
  const reportedQuery = useQuery({
    queryKey: ["admin-reported-reviews"],
    queryFn: () => adminService.listReportedReviews()
  });

  const dismissMutation = useMutation({
    mutationFn: (reviewId: string) => adminService.dismissReports(reviewId),
    onSuccess: async () => {
      await reportedQuery.refetch();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => adminService.deleteReview(reviewId),
    onSuccess: async () => {
      await reportedQuery.refetch();
    }
  });

  if (reportedQuery.isLoading) {
    return <LoadingState label="Cargando resenas reportadas..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Reportadas</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Cola prioritaria
        </h1>
      </section>

      <div className="space-y-4">
        {reportedQuery.data?.items.map((review) => (
          <article key={review.id} className="surface space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-slate-950 dark:text-white">
                {review.product.nombre}
              </p>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                {review.reportCount} reportes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <EstrellasPuntuacion value={review.calificacion} />
              <span className="text-sm text-slate-500 dark:text-slate-300">
                {review.usuario?.nombre ?? "Cliente"}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{review.titulo}</h2>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{review.comentario}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                onClick={() => dismissMutation.mutate(review.id)}
              >
                Desestimar reportes
              </button>
              <button
                type="button"
                className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600"
                onClick={() => {
                  if (window.confirm("Quieres eliminar esta resena reportada?")) {
                    deleteMutation.mutate(review.id);
                  }
                }}
              >
                Eliminar resena
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
