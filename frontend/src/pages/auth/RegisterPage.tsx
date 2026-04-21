import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await register(form);
      navigate("/verificacion-pendiente", { state: { email: form.email } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos crear la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex justify-center">
      <form onSubmit={onSubmit} className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Registro</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Crea tu cuenta
        </h1>
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <Input
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta..." : "Registrarme"}
        </Button>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
};
