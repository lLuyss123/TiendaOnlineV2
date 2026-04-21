import type { Review, ReviewPhoto } from "@/types/api";

import { EmptyState } from "@/components/ui/EmptyState";

import { TarjetaResena } from "./TarjetaResena";

export const ListaResenas = ({
  reviews,
  isOwner,
  onVote,
  onRemoveVote,
  onReport,
  onEdit,
  onDelete,
  onOpenGallery,
  emptyTitle = "Aun no hay resenas",
  emptyDescription = "Se el primero en compartir como te fue con este producto."
}: {
  reviews: Review[];
  isOwner?: (review: Review) => boolean;
  onVote: (reviewId: string, util: boolean) => void;
  onRemoveVote: (reviewId: string) => void;
  onReport: (reviewId: string, motivo: "Spam" | "Contenido inapropiado" | "Resena falsa" | "Otro") => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onOpenGallery: (photos: ReviewPhoto[], index: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) => {
  if (!reviews.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <TarjetaResena
          key={review.id}
          review={review}
          isOwner={isOwner?.(review)}
          onVote={onVote}
          onRemoveVote={onRemoveVote}
          onReport={onReport}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenGallery={onOpenGallery}
        />
      ))}
    </div>
  );
};
