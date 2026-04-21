import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { authService } from "@/services/auth";

export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const verificationQuery = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => authService.verifyEmail(token),
    enabled: Boolean(token)
  });

  if (verificationQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Validando tu correo..." />
      </div>
    );
  }

  return (
    <div className="page-shell flex justify-center">
      <div className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Verificación</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          {verificationQuery.isSuccess ? "Cuenta activada" : "No pudimos validar el enlace"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {verificationQuery.isSuccess
            ? verificationQuery.data.message
            : verificationQuery.error instanceof Error
              ? verificationQuery.error.message
              : "Solicita un nuevo correo de verificación."}
        </p>
        <Link to={verificationQuery.isSuccess ? "/login" : "/verificacion-pendiente"}>
          <Button>{verificationQuery.isSuccess ? "Ir al login" : "Reenviar correo"}</Button>
        </Link>
      </div>
    </div>
  );
};
