import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { accountService } from "@/services/account";

export const ProfilePage = () => {
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => accountService.getProfile()
  });
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    avatar: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profileQuery.data?.item) {
      setForm({
        nombre: profileQuery.data.item.nombre,
        email: profileQuery.data.item.email,
        telefono: profileQuery.data.item.telefono ?? "",
        avatar: profileQuery.data.item.avatar ?? ""
      });
    }
  }, [profileQuery.data]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await accountService.updateProfile(form);
    setMessage(`Perfil actualizado para ${response.item.nombre}.`);
  };

  return (
    <form onSubmit={onSubmit} className="surface space-y-5 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Perfil</p>
      <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">Tus datos</h1>
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
        label="Teléfono"
        value={form.telefono}
        onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
      />
      <Input
        label="Avatar URL"
        value={form.avatar}
        onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
      />
      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
      <Button type="submit">Guardar cambios</Button>
    </form>
  );
};
