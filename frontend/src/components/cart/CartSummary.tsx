import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { currency } from "@/lib/utils";

export const CartSummary = ({
  subtotal,
  shipping,
  discount = 0,
  actionHref = "/checkout",
  actionLabel = "Ir al checkout"
}: {
  subtotal: number;
  shipping: number;
  discount?: number;
  actionHref?: string;
  actionLabel?: string;
}) => {
  const total = Math.max(subtotal + shipping - discount, 0);

  return (
    <aside className="surface h-fit space-y-5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-ember">Resumen</p>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong>{currency(subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Envío</span>
          <strong>{currency(shipping)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Descuento</span>
          <strong>- {currency(discount)}</strong>
        </div>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-semibold dark:border-white/10">
        <span>Total</span>
        <span>{currency(total)}</span>
      </div>
      <Link to={actionHref}>
        <Button fullWidth>{actionLabel}</Button>
      </Link>
    </aside>
  );
};
