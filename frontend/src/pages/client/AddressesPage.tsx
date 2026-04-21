import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Address } from "@/types/api";
import { accountService } from "@/services/account";

const emptyAddress: Omit<Address, "id"> = {
  alias: "",
  destinatario: "",
  telefono: "",
  direccion1: "",
  direccion2: "",
  ciudad: "",
  region: "",
  codigoPostal: "",
  pais: "CO",
  esPrincipal: false
};

export const AddressesPage = () => {
  const addressesQuery = useQuery({
    queryKey: ["addresses"],
    queryFn: () => accountService.getAddresses()
  });
  const [form, setForm] = useState<Omit<Address, "id">>(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      await accountService.updateAddress(editingId, form);
    } else {
      await accountService.createAddress(form);
    }
    setForm(emptyAddress);
    setEditingId(null);
    await addressesQuery.refetch();
  };

  useEffect(() => {
    if (!editingId) {
      setForm(emptyAddress);
    }
  }, [editingId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <section className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Direcciones</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Envío
        </h1>
        <div className="space-y-3">
          {addressesQuery.data?.items.map((address) => (
            <div key={address.id} className="rounded-[1.5rem] border border-slate-200 p-4 dark:border-white/10">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong className="text-slate-950 dark:text-white">{address.alias}</strong>
                {address.esPrincipal ? (
                  <span className="rounded-full bg-ember px-3 py-1 text-xs font-semibold text-white">
                    Principal
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {address.destinatario} · {address.telefono}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {address.direccion1}, {address.ciudad}, {address.region}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10"
                  onClick={() => {
                    setEditingId(address.id);
                    setForm({
                      alias: address.alias,
                      destinatario: address.destinatario,
                      telefono: address.telefono,
                      direccion1: address.direccion1,
                      direccion2: address.direccion2 ?? "",
                      ciudad: address.ciudad,
                      region: address.region,
                      codigoPostal: address.codigoPostal,
                      pais: address.pais,
                      esPrincipal: address.esPrincipal
                    });
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500"
                  onClick={() =>
                    void accountService.deleteAddress(address.id).then(() => addressesQuery.refetch())
                  }
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <form onSubmit={saveAddress} className="surface space-y-4 p-8">
        <Input
          label="Alias"
          value={form.alias}
          onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))}
        />
        <Input
          label="Destinatario"
          value={form.destinatario}
          onChange={(event) =>
            setForm((current) => ({ ...current, destinatario: event.target.value }))
          }
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
        />
        <Input
          label="Dirección principal"
          value={form.direccion1}
          onChange={(event) =>
            setForm((current) => ({ ...current, direccion1: event.target.value }))
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Ciudad"
            value={form.ciudad}
            onChange={(event) => setForm((current) => ({ ...current, ciudad: event.target.value }))}
          />
          <Input
            label="Región"
            value={form.region}
            onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Código postal"
            value={form.codigoPostal}
            onChange={(event) =>
              setForm((current) => ({ ...current, codigoPostal: event.target.value }))
            }
          />
          <Input
            label="País"
            value={form.pais}
            onChange={(event) => setForm((current) => ({ ...current, pais: event.target.value }))}
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.esPrincipal}
            onChange={(event) =>
              setForm((current) => ({ ...current, esPrincipal: event.target.checked }))
            }
          />
          Usar como dirección principal
        </label>
        <Button type="submit">{editingId ? "Actualizar dirección" : "Guardar dirección"}</Button>
      </form>
    </div>
  );
};
