import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { adminService } from "@/services/admin";

export const AdminTagsPage = () => {
  const tagsQuery = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => adminService.listTags()
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    color: "#111827",
    icono: "sparkles"
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(editingId ? "Actualizando etiqueta..." : "Creando etiqueta...");
    setMessageTone("info");

    try {
      if (editingId) {
        await adminService.updateTag(editingId, form);
      } else {
        await adminService.createTag(form);
      }

      setForm({ nombre: "", color: "#111827", icono: "sparkles" });
      setEditingId(null);
      await tagsQuery.refetch();
      setMessage(editingId ? "Etiqueta actualizada correctamente." : "Etiqueta creada correctamente.");
      setMessageTone("success");
    } catch {
      setMessage("No pudimos guardar la etiqueta. Intentalo de nuevo.");
      setMessageTone("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    setDeletingId(tagId);
    setMessage("Eliminando etiqueta...");
    setMessageTone("info");

    try {
      await adminService.deleteTag(tagId);
      await tagsQuery.refetch();
      setMessage("Etiqueta eliminada correctamente.");
      setMessageTone("success");
    } catch {
      setMessage("No pudimos eliminar la etiqueta.");
      setMessageTone("error");
    } finally {
      setDeletingId(null);
    }
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
        {message ? <StatusNotice tone={messageTone}>{message}</StatusNotice> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : editingId ? "Actualizar etiqueta" : "Crear etiqueta"}
        </Button>
      </form>
      <section className="space-y-4">
        {tagsQuery.isLoading ? (
          <StatusNotice tone="info" loading>
            Cargando etiquetas...
          </StatusNotice>
        ) : tagsQuery.isError ? (
          <StatusNotice tone="error">No pudimos cargar la lista de etiquetas.</StatusNotice>
        ) : tagsQuery.data?.items.length ? (
          <>
            {tagsQuery.isRefetching ? (
              <StatusNotice tone="info" loading>
                Actualizando lista de etiquetas...
              </StatusNotice>
            ) : null}
            {tagsQuery.data.items.map((tag) => (
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
                    disabled={isSubmitting || Boolean(deletingId)}
                    onClick={() => {
                      setEditingId(tag.id!);
                      setForm({
                        nombre: tag.nombre,
                        color: tag.color,
                        icono: tag.icono
                      });
                      setMessage(`Listo para editar la etiqueta ${tag.nombre}.`);
                      setMessageTone("info");
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    disabled={isSubmitting || Boolean(deletingId)}
                    onClick={() => void handleDelete(tag.id!)}
                  >
                    {deletingId === tag.id ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <StatusNotice tone="info">Todavia no has creado etiquetas.</StatusNotice>
        )}
      </section>
    </div>
  );
};
