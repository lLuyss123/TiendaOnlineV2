import { useQuery } from "@tanstack/react-query";
import { marked } from "marked";
import { useParams } from "react-router-dom";

import { LoadingState } from "@/components/ui/LoadingState";
import { dateTime } from "@/lib/utils";
import { shopService } from "@/services/shop";

export const BlogPostPage = () => {
  const { id = "" } = useParams();
  const postQuery = useQuery({
    queryKey: ["blog-post", id],
    queryFn: () => shopService.getBlogPost(id),
    enabled: Boolean(id)
  });

  if (postQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Cargando artículo..." />
      </div>
    );
  }

  const post = postQuery.data?.item;

  if (!post) {
    return null;
  }

  return (
    <article className="page-shell space-y-8">
      <img src={post.imagen} alt={post.titulo} className="surface aspect-[16/8] w-full object-cover p-0" />
      <div className="surface space-y-5 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">
          {dateTime(post.publishedAt ?? post.createdAt)}
        </p>
        <h1 className="font-display text-6xl uppercase leading-none text-slate-950 dark:text-white">
          {post.titulo}
        </h1>
        <div
          className="prose prose-slate max-w-none prose-headings:font-display prose-headings:uppercase dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: marked.parse(post.contenido) }}
        />
      </div>
    </article>
  );
};
