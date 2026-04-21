import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/services/api";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        (user.rol === "CLIENTE" ? "/cuenta" : "/admin");
      navigate(redirectTo);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) {
        navigate("/verificacion-pendiente", { state: { email } });
        return;
      }

      setError(cause instanceof Error ? cause.message : "No pudimos iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex justify-center">
      <form onSubmit={onSubmit} className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Acceso</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">Entrar</h1>
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Iniciar sesión"}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
          <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          <Link to="/registro">Crear una cuenta</Link>
        </div>
      </form>
    </div>
  );
};
