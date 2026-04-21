import { ThumbsDown, ThumbsUp } from "lucide-react";

import type { Review } from "@/types/api";

export const BotonesVoto = ({
  review,
  disabled,
  onVote,
  onRemove
}: {
  review: Review;
  disabled?: boolean;
  onVote: (util: boolean) => void;
  onRemove: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    <span className="text-sm text-slate-500 dark:text-slate-300">Te fue util esta resena?</span>
    <button
      type="button"
      disabled={disabled}
      onClick={() => (review.votos.userVote === true ? onRemove() : onVote(true))}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        review.votos.userVote === true
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
      }`}
    >
      <ThumbsUp size={14} />
      Si ({review.votos.utiles})
    </button>
    <button
      type="button"
      disabled={disabled}
      onClick={() => (review.votos.userVote === false ? onRemove() : onVote(false))}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        review.votos.userVote === false
          ? "border-red-500 bg-red-50 text-red-700"
          : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
      }`}
    >
      <ThumbsDown size={14} />
      No ({review.votos.noUtiles})
    </button>
  </div>
);
