import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { adminService } from "@/services/admin";

const emptyCoupon = {
  codigo: "",
  tipo: "PERCENTAGE",
  valor: "10",
  maxUsos: "",
  vencimiento: "",
  activo: true,
  descripcion: ""
} as const;

export const AdminCouponsPage = () => {
  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => adminService.listCoupons()
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("success");
  const [form, setForm] = useState({ ...emptyCoupon });

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

    setIsSubmitting(true);
    setMessage(editingId ? "Actualizando cupon..." : "Creando cupon...");
    setMessageTone("info");

    try {
      if (editingId) {
        await adminService.updateCoupon(editingId, payload);
      } else {
        await adminService.createCoupon(payload);
      }

      setEditingId(null);
      setForm({ ...emptyCoupon });
      await couponsQuery.refetch();
      setMessage(editingId ? "Cupon actualizado correctamente." : "Cupon creado correctamente.");
      setMessageTone("success");
    } catch {
      setMessage("No pudimos guardar el cupon. Intentalo de nuevo.");
      setMessageTone("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    setDeletingId(couponId);
    setMessage("Eliminando cupon...");
    setMessageTone("info");

    try {
      await adminService.deleteCoupon(couponId);
      await couponsQuery.refetch();
      setMessage("Cupon eliminado correctamente.");
      setMessageTone("success");
    } catch {
      setMessage("No pudimos eliminar el cupon.");
      setMessageTone("error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onSubmit} className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Cupones</p>
        <Input
          label="Codigo"
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
          label="Descripcion"
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
          Cupon activo
        </label>

        {message ? <StatusNotice tone={messageTone}>{message}</StatusNotice> : null}

        <Button type="submit" disabled={isSubmitting || Boolean(deletingId)}>
          {isSubmitting ? "Guardando..." : editingId ? "Actualizar cupon" : "Crear cupon"}
        </Button>
      </form>

      <section className="space-y-4">
        {couponsQuery.isLoading ? (
          <StatusNotice tone="info" loading>
            Cargando cupones...
          </StatusNotice>
        ) : couponsQuery.isError ? (
          <StatusNotice tone="error">No pudimos cargar los cupones.</StatusNotice>
        ) : couponsQuery.data?.items.length ? (
          <>
            {couponsQuery.isRefetching ? (
              <StatusNotice tone="info" loading>
                Actualizando lista de cupones...
              </StatusNotice>
            ) : null}

            {couponsQuery.data.items.map((coupon) => (
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
                    disabled={isSubmitting || Boolean(deletingId)}
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
                      setMessage(`Listo para editar el cupon ${coupon.codigo}.`);
                      setMessageTone("info");
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    disabled={isSubmitting || Boolean(deletingId)}
                    onClick={() => void handleDeleteCoupon(coupon.id)}
                  >
                    {deletingId === coupon.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <StatusNotice tone="info">Todavia no hay cupones creados.</StatusNotice>
        )}
      </section>
    </div>
  );
};
