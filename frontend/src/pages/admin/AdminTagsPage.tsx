import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminService } from "@/services/admin";

export const AdminTagsPage = () => {
  const tagsQuery = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => adminService.listTags()
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    color: "#111827",
    icono: "sparkles"
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      await adminService.updateTag(editingId, form);
    } else {
      await adminService.createTag(form);
    }
    setForm({ nombre: "", color: "#111827", icono: "sparkles" });
    setEditingId(null);
    await tagsQuery.refetch();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={onSubmit} className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Etiquetas</p>
        <Input
          label="Nombre"
          value={form.nombre}
          onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
        />
        <Input
          label="Color"
          value={form.color}
          onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
        />
        <Input
          label="Icono"
          value={form.icono}
          onChange={(event) => setForm((current) => ({ ...current, icono: event.target.value }))}
        />
        <Button type="submit">{editingId ? "Actualizar etiqueta" : "Crear etiqueta"}</Button>
      </form>
      <section className="space-y-4">
        {tagsQuery.data?.items.map((tag) => (
          <div key={tag.id} className="surface flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ background: tag.color }} />
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">{tag.nombre}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">{tag.icono}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(tag.id!);
                  setForm({
                    nombre: tag.nombre,
                    color: tag.color,
                    icono: tag.icono
                  });
                }}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => void adminService.deleteTag(tag.id!).then(() => tagsQuery.refetch())}
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
