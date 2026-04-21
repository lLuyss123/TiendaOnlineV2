import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminService } from "@/services/admin";
import { shopService } from "@/services/shop";

const emptyPost = {
  titulo: "",
  excerpt: "",
  contenido: "",
  imagen: "",
  relatedProductIds: [] as string[],
  publicado: true
};

export const AdminBlogPage = () => {
  const postsQuery = useQuery({
    queryKey: ["admin-blog"],
    queryFn: () => adminService.listBlogPosts()
  });
  const productsQuery = useQuery({
    queryKey: ["admin-blog-products"],
    queryFn: () => shopService.listProducts(new URLSearchParams({ pageSize: "30" }))
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyPost);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingId) {
      await adminService.updateBlogPost(editingId, form);
    } else {
      await adminService.createBlogPost(form);
    }
    setEditingId(null);
    setForm(emptyPost);
    await postsQuery.refetch();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form onSubmit={onSubmit} className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Blog</p>
        <Input
          label="Título"
          value={form.titulo}
          onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
        />
        <Input
          label="Excerpt"
          value={form.excerpt}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
        />
        <Input
          label="Imagen"
          value={form.imagen}
          onChange={(event) => setForm((current) => ({ ...current, imagen: event.target.value }))}
        />
        <Input
          label="Contenido Markdown"
          textarea
          value={form.contenido}
          onChange={(event) =>
            setForm((current) => ({ ...current, contenido: event.target.value }))
          }
        />
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Productos relacionados
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {productsQuery.data?.items.map((product) => (
              <label
                key={product.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-white/10"
              >
                <input
                  type="checkbox"
                  checked={form.relatedProductIds.includes(product.id)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      relatedProductIds: event.target.checked
                        ? [...current.relatedProductIds, product.id]
                        : current.relatedProductIds.filter((item) => item !== product.id)
                    }))
                  }
                />
                {product.nombre}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={(event) => setForm((current) => ({ ...current, publicado: event.target.checked }))}
          />
          Publicado
        </label>
        <Button type="submit">{editingId ? "Actualizar artículo" : "Crear artículo"}</Button>
      </form>
      <section className="space-y-4">
        {postsQuery.data?.items.map((post) => (
          <div key={post.id} className="surface space-y-4 p-6">
            <img src={post.imagen} alt={post.titulo} className="aspect-[16/10] w-full rounded-[1.5rem] object-cover" />
            <div className="space-y-2">
              <p className="font-semibold text-slate-950 dark:text-white">{post.titulo}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{post.excerpt}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(post.id);
                  setForm({
                    titulo: post.titulo,
                    excerpt: post.excerpt,
                    contenido: post.contenido,
                    imagen: post.imagen,
                    relatedProductIds: post.relatedProductIds,
                    publicado: post.publicado
                  });
                }}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => void adminService.deleteBlogPost(post.id).then(() => postsQuery.refetch())}
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
