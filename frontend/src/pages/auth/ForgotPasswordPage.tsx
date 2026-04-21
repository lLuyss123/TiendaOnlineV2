import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authService.requestPasswordReset(email);
      setMessage(response.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex justify-center">
      <form onSubmit={onSubmit} className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Recuperación</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Restablecer contraseña
        </h1>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
        </Button>
      </form>
    </div>
  );
};
