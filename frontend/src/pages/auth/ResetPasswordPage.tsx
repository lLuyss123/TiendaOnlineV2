import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { authService } from "@/services/auth";

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationQuery = useQuery({
    queryKey: ["validate-reset-token", token],
    queryFn: () => authService.validateResetToken(token),
    enabled: Boolean(token)
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await authService.resetPassword({
        token,
        password,
        confirmPassword
      });
      setMessage(response.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos actualizar tu contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validationQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Validando token..." />
      </div>
    );
  }

  if (validationQuery.isError) {
    return (
      <div className="page-shell flex justify-center">
        <div className="surface w-full max-w-xl space-y-5 p-8">
          <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
            Enlace expirado
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {validationQuery.error instanceof Error
              ? validationQuery.error.message
              : "Solicita uno nuevo para continuar."}
          </p>
          <Link to="/token-expirado">
            <Button>Solicitar otro enlace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex justify-center">
      <form onSubmit={onSubmit} className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Nueva contraseña</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Define una nueva clave
        </h1>
        <Input
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Actualizando..." : "Guardar nueva contraseña"}
        </Button>
      </form>
    </div>
  );
};
