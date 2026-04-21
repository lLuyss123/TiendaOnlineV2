import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminService } from "@/services/admin";

const emptyCoupon = {
  codigo: "",
  tipo: "PERCENTAGE",
  valor: "10",
  maxUsos: "",
  vencimiento: "",
  activo: true,
  descripcion: ""
};

export const AdminCouponsPage = () => {
  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => adminService.listCoupons()
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      codigo: form.codigo,
      tipo: form.tipo,
      valor: Number(form.valor),
      maxUsos: form.maxUsos ? Number(form.maxUsos) : undefined,
      vencimiento: form.vencimiento || undefined,
      activo: form.activo,
      descripcion: form.descripcion
    };

    if (editingId) {
      await adminService.updateCoupon(editingId, payload);
    } else {
      await adminService.createCoupon(payload);
    }

    setEditingId(null);
    setForm(emptyCoupon);
    await couponsQuery.refetch();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onSubmit} className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Cupones</p>
        <Input
          label="Código"
          value={form.codigo}
          onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Tipo</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              value={form.tipo}
              onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
            </select>
          </label>
          <Input
            label="Valor"
            type="number"
            value={form.valor}
            onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value }))}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Max usos"
            type="number"
            value={form.maxUsos}
            onChange={(event) => setForm((current) => ({ ...current, maxUsos: event.target.value }))}
          />
          <Input
            label="Vencimiento ISO"
            value={form.vencimiento}
            onChange={(event) =>
              setForm((current) => ({ ...current, vencimiento: event.target.value }))
            }
          />
        </div>
        <Input
          label="Descripción"
          value={form.descripcion}
          onChange={(event) =>
            setForm((current) => ({ ...current, descripcion: event.target.value }))
          }
        />
        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))}
          />
          Cupón activo
        </label>
        <Button type="submit">{editingId ? "Actualizar cupón" : "Crear cupón"}</Button>
      </form>
      <section className="space-y-4">
        {couponsQuery.data?.items.map((coupon) => (
          <div key={coupon.id} className="surface flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{coupon.codigo}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {coupon.tipo} · {coupon.valor}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(coupon.id);
                  setForm({
                    codigo: coupon.codigo,
                    tipo: coupon.tipo,
                    valor: String(coupon.valor),
                    maxUsos: coupon.maxUsos ? String(coupon.maxUsos) : "",
                    vencimiento: coupon.vencimiento ?? "",
                    activo: coupon.activo,
                    descripcion: coupon.descripcion ?? ""
                  });
                }}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => void adminService.deleteCoupon(coupon.id).then(() => couponsQuery.refetch())}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
