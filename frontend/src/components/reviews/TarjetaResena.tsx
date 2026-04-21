import { Flag, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { relativeTime, dateTime, fitLabel } from "@/lib/utils";
import type { Review, ReviewPhoto } from "@/types/api";

import { BotonesVoto } from "./BotonesVoto";
import { EstrellasPuntuacion } from "./EstrellasPuntuacion";
import { GaleriaFotosResena } from "./GaleriaFotosResena";
import { RespuestaAdmin } from "./RespuestaAdmin";

const reviewReasons = ["Spam", "Contenido inapropiado", "Resena falsa", "Otro"] as const;

export const TarjetaResena = ({
  review,
  isOwner,
  votingDisabled,
  onVote,
  onRemoveVote,
  onReport,
  onEdit,
  onDelete,
  onOpenGallery
}: {
  review: Review;
  isOwner?: boolean;
  votingDisabled?: boolean;
  onVote: (reviewId: string, util: boolean) => void;
  onRemoveVote: (reviewId: string) => void;
  onReport: (reviewId: string, motivo: (typeof reviewReasons)[number]) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onOpenGallery: (photos: ReviewPhoto[], index: number) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isLong = review.comentario.length > 220;

  return (
    <article className="surface space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: review.usuario?.avatarColor.background ?? "#e2e8f0",
              color: review.usuario?.avatarColor.foreground ?? "#0f172a"
            }}
          >
            {review.usuario?.iniciales ?? "CL"}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <strong className="text-slate-950 dark:text-white">
                {review.usuario?.nombre ?? "Cliente"}
              </strong>
              {review.verificado ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Compra verificada
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <EstrellasPuntuacion value={review.calificacion} />
              <span className="text-sm text-slate-500 dark:text-slate-300" title={dateTime(review.createdAt)}>
                {relativeTime(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {isOwner ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit?.(review)}
              className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:border-ember hover:text-ember dark:border-white/10 dark:text-slate-300"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(review)}
              className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:border-red-500 hover:text-red-500 dark:border-white/10 dark:text-slate-300"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{review.titulo}</h3>
        <p
          className="text-sm leading-7 text-slate-600 dark:text-slate-300"
          style={
            expanded || !isLong
              ? undefined
              : {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 3,
                  overflow: "hidden"
                }
          }
        >
          {review.comentario}
        </p>
        {isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-sm font-semibold text-ember"
          >
            {expanded ? "Ver menos" : "Ver mas"}
          </button>
        ) : null}
      </div>

      {review.talla || review.ajuste ? (
        <div className="flex flex-wrap gap-2">
          {review.talla ? (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Talla comprada: {review.talla}
            </span>
          ) : null}
          {review.ajuste ? (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Ajuste: {fitLabel(review.ajuste)}
            </span>
          ) : null}
        </div>
      ) : null}

      <GaleriaFotosResena photos={review.fotos} onOpen={onOpenGallery} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <BotonesVoto
          review={review}
          disabled={votingDisabled}
          onVote={(util) => onVote(review.id, util)}
          onRemove={() => onRemoveVote(review.id)}
        />
        {!isOwner ? (
          <button
            type="button"
            onClick={() => setReportOpen((current) => !current)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300"
          >
            <Flag size={14} />
            Reportar
          </button>
        ) : null}
      </div>

      {reportOpen ? (
        <div className="rounded-[1.25rem] border border-slate-200 p-4 dark:border-white/10">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Reportar esta resena
          </p>
          <div className="flex flex-wrap gap-2">
            {reviewReasons.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => {
                  onReport(review.id, reason);
                  setReportOpen(false);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-ember hover:text-ember dark:border-white/10 dark:text-slate-300"
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <RespuestaAdmin reply={review.respuesta} />
    </article>
  );
};
