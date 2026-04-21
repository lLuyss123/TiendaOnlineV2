import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/hooks/useCart";
import { openBoldCheckout } from "@/lib/bold";
import { accountService } from "@/services/account";
import { shopService } from "@/services/shop";

export const CheckoutPage = () => {
  const { refreshCart } = useCart();
  const cartQuery = useQuery({
    queryKey: ["checkout-cart"],
    queryFn: () => accountService.getCart()
  });
  const addressesQuery = useQuery({
    queryKey: ["checkout-addresses"],
    queryFn: () => accountService.getAddresses()
  });
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = cartQuery.data?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.precioOferta ?? item.product.precio) * item.cantidad,
    0
  );

  const applyCoupon = async () => {
    const response = await shopService.validateCoupon({ codigo: coupon, subtotal });
    setDiscount(response.discount);
    setMessage(`Cupón aplicado: ${coupon.toUpperCase()}.`);
  };

  const createOrder = async () => {
    setIsSubmitting(true);
    try {
      const response = await accountService.createOrder({
        addressId: selectedAddress,
        couponCode: coupon || undefined,
        metodoPago: "BOLD"
      });
      setMessage(`Pedido ${response.item.reference} creado. Abriendo Bold Checkout...`);
      await openBoldCheckout(response.payment.checkout);
      await refreshCart();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No pudimos iniciar el checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="surface space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Checkout</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Dirección y pago
        </h1>
        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>Dirección de envío</span>
          <select
            className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
            value={selectedAddress}
            onChange={(event) => setSelectedAddress(event.target.value)}
          >
            <option value="">Selecciona una dirección</option>
            {addressesQuery.data?.items.map((address) => (
              <option key={address.id} value={address.id}>
                {address.alias} · {address.ciudad}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            label="Cupón"
            value={coupon}
            onChange={(event) => setCoupon(event.target.value)}
            placeholder="Ej. SPORT10"
          />
          <div className="self-end">
            <Button variant="secondary" onClick={() => void applyCoupon()} disabled={!coupon}>
              Validar cupón
            </Button>
          </div>
        </div>
        {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        <div className="rounded-[1.5rem] border border-slate-200 p-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          El botón final crea la orden en estado pendiente y abre Bold Checkout en modo embebido.
        </div>
        <Button onClick={() => void createOrder()} disabled={!selectedAddress || isSubmitting}>
          {isSubmitting ? "Preparando checkout..." : "Pagar con Bold"}
        </Button>
      </section>

      <CartSummary
        subtotal={subtotal}
        shipping={18000}
        discount={discount}
        actionHref="#"
        actionLabel="Resumen listo"
      />
    </div>
  );
};
