import { useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth";

export const VerificationPendingPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState(
    (location.state as { email?: string } | null)?.email ?? ""
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onResend = async () => {
    setIsSubmitting(true);
    try {
      const response = await authService.resendVerification(email);
      setMessage(response.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell flex justify-center">
      <div className="surface w-full max-w-xl space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Correo pendiente</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Revisa tu email
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Aún necesitamos confirmar tu correo antes de permitir login y checkout.
        </p>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        <Button onClick={() => void onResend()} disabled={isSubmitting || !email}>
          {isSubmitting ? "Enviando..." : "Reenviar correo"}
        </Button>
      </div>
    </div>
  );
};
