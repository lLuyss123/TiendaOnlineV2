import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export const TokenExpiredPage = () => (
  <div className="page-shell flex justify-center">
    <div className="surface w-full max-w-xl space-y-5 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Token expirado</p>
      <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
        Solicita un nuevo enlace
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Por seguridad, los enlaces de recuperación vencen rápido. Puedes generar uno nuevo en segundos.
      </p>
      <Link to="/recuperar-contrasena">
        <Button>Volver a recuperación</Button>
      </Link>
    </div>
  </div>
);
