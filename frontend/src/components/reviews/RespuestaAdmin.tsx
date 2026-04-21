import { ShieldCheck } from "lucide-react";

import type { ReviewReply } from "@/types/api";

export const RespuestaAdmin = ({ reply }: { reply: ReviewReply | null }) => {
  if (!reply) {
    return null;
  }

  return (
    <div className="rounded-[1.25rem] bg-slate-100/90 p-4 dark:bg-white/10">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <ShieldCheck size={16} />
        Respuesta del equipo SportStore
      </div>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{reply.contenido}</p>
    </div>
  );
};
