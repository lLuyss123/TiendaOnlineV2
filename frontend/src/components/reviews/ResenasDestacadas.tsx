import type { Review, ReviewPhoto } from "@/types/api";

import { TarjetaResena } from "./TarjetaResena";

export const ResenasDestacadas = ({
  positiva,
  critica,
  onVote,
  onRemoveVote,
  onReport,
  onOpenGallery
}: {
  positiva: Review | null;
  critica: Review | null;
  onVote: (reviewId: string, util: boolean) => void;
  onRemoveVote: (reviewId: string) => void;
  onReport: (reviewId: string, motivo: "Spam" | "Contenido inapropiado" | "Resena falsa" | "Otro") => void;
  onOpenGallery: (photos: ReviewPhoto[], index: number) => void;
}) => {
  if (!positiva && !critica) {
    return null;
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      {positiva ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            Resena mas util positiva
          </p>
          <TarjetaResena
            review={positiva}
            onVote={onVote}
            onRemoveVote={onRemoveVote}
            onReport={onReport}
            onOpenGallery={onOpenGallery}
          />
        </div>
      ) : null}
      {critica ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">
            Resena mas util critica
          </p>
          <TarjetaResena
            review={critica}
            onVote={onVote}
            onRemoveVote={onRemoveVote}
            onReport={onReport}
            onOpenGallery={onOpenGallery}
          />
        </div>
      ) : null}
    </section>
  );
};
