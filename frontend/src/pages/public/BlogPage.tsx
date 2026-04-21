import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { LoadingState } from "@/components/ui/LoadingState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { dateTime } from "@/lib/utils";
import { shopService } from "@/services/shop";

export const BlogPage = () => {
  const postsQuery = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => shopService.listBlogPosts()
  });

  return (
    <div className="page-shell space-y-8">
      <SectionHeading
        eyebrow="Blog"
        title="Consejos, contexto y producto"
        description="Contenido deportivo con recomendaciones y conexiones directas al catálogo."
      />
      {postsQuery.isLoading ? <LoadingState label="Cargando artículos..." /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {postsQuery.data?.items.map((post) => (
          <article key={post.id} className="surface overflow-hidden">
            <img src={post.imagen} alt={post.titulo} className="aspect-[16/10] w-full object-cover" />
            <div className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">
                {dateTime(post.publishedAt ?? post.createdAt)}
              </p>
              <h2 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
                {post.titulo}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`} className="text-sm font-semibold text-ember">
                Leer artículo
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
