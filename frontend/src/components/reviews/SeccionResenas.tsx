import {
  useDeferredValue,
  useEffect,
  useState
} from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { buildOptimisticReviewUser } from "@/lib/reviews";
import type {
  Review,
  ReviewFilters,
  ReviewListResponse,
  ReviewPhoto
} from "@/types/api";
import {
  reviewFilterToSearchParams,
  shopService
} from "@/services/shop";

import { BotonCargarMas } from "./BotonCargarMas";
import { BotonEscribirResena } from "./BotonEscribirResena";
import { FiltrosResenas } from "./FiltrosResenas";
import { FormularioResena } from "./FormularioResena";
import { ListaResenas } from "./ListaResenas";
import { ResenasDestacadas } from "./ResenasDestacadas";
import { ResumenCalificaciones } from "./ResumenCalificaciones";

const reviewQueryKey = (productId: string, filters: ReviewFilters) => [
  "product-reviews",
  productId,
  filters
];

const parseFilters = (params: URLSearchParams): ReviewFilters => ({
  estrellas: params.get("estrellas") ? Number(params.get("estrellas")) : null,
  tipo: (params.get("tipo") as ReviewFilters["tipo"]) ?? null,
  ajuste: params.get("ajuste") ?? null,
  orden: (params.get("orden") as ReviewFilters["orden"]) ?? "recientes",
  busqueda: params.get("busqueda") ?? ""
});

const updateInfiniteReviewData = (
  current: InfiniteData<ReviewListResponse> | undefined,
  updater: (review: Review) => Review
) => {
  if (!current) {
    return current;
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      resenas: page.resenas.map(updater),
      resenaPositivaDestacada: page.resenaPositivaDestacada
        ? updater(page.resenaPositivaDestacada)
        : null,
      resenaCriticaDestacada: page.resenaCriticaDestacada
        ? updater(page.resenaCriticaDestacada)
        : null
    }))
  };
};

const applyVote = (review: Review, nextVote: boolean | null) => {
  const previousVote = review.votos.userVote;
  let utiles = review.votos.utiles;
  let noUtiles = review.votos.noUtiles;

  if (previousVote === true) {
    utiles -= 1;
  }

  if (previousVote === false) {
    noUtiles -= 1;
  }

  if (nextVote === true) {
    utiles += 1;
  }

  if (nextVote === false) {
    noUtiles += 1;
  }

  return {
    ...review,
    utilidad: utiles - noUtiles,
    votos: {
      utiles,
      noUtiles,
      userVote: nextVote
    }
  };
};

export const SeccionResenas = ({ productId }: { productId: string }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [pendingReview, setPendingReview] = useState<Review | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: ReviewPhoto[]; index: number } | null>(null);
  const parsedFilters = parseFilters(searchParams);
  const deferredSearch = useDeferredValue(parsedFilters.busqueda ?? "");
  const filters = {
    ...parsedFilters,
    busqueda: deferredSearch
  };

  const reviewsQuery = useInfiniteQuery({
    queryKey: reviewQueryKey(productId, filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      shopService.listReviews(
        productId,
        reviewFilterToSearchParams({
          ...filters,
          page: Number(pageParam),
          limit: 10
        })
      ),
    getNextPageParam: (lastPage, pages) => (lastPage.hayMas ? pages.length + 1 : undefined)
  });

  const myReviewQuery = useQuery({
    queryKey: ["my-review", productId],
    queryFn: () => shopService.getMyReview(productId),
    enabled: Boolean(user)
  });

  const allReviews = reviewsQuery.data?.pages.flatMap((page) => page.resenas) ?? [];
  const summary = reviewsQuery.data?.pages[0]?.resumen ?? null;
  const featuredPositive = reviewsQuery.data?.pages[0]?.resenaPositivaDestacada ?? null;
  const featuredCritical = reviewsQuery.data?.pages[0]?.resenaCriticaDestacada ?? null;
  const displayedReviews =
    pendingReview && !myReviewQuery.data?.item
      ? [pendingReview, ...allReviews]
      : allReviews;

  const syncQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["product", productId] }),
      queryClient.invalidateQueries({ queryKey: ["my-review", productId] }),
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] })
    ]);
  };

  const voteMutation = useMutation({
    mutationFn: ({ reviewId, util }: { reviewId: string; util: boolean }) =>
      shopService.voteReview(reviewId, util),
    onMutate: async ({ reviewId, util }) => {
      await queryClient.cancelQueries({ queryKey: ["product-reviews", productId] });
      const previous = queryClient.getQueryData(reviewQueryKey(productId, filters));

      queryClient.setQueryData(
        reviewQueryKey(productId, filters),
        (current: InfiniteData<ReviewListResponse> | undefined) =>
        updateInfiniteReviewData(current, (review) =>
          review.id === reviewId ? applyVote(review, util) : review
        )
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(reviewQueryKey(productId, filters), context?.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    }
  });

  const removeVoteMutation = useMutation({
    mutationFn: (reviewId: string) => shopService.deleteReviewVote(reviewId),
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: ["product-reviews", productId] });
      const previous = queryClient.getQueryData(reviewQueryKey(productId, filters));

      queryClient.setQueryData(
        reviewQueryKey(productId, filters),
        (current: InfiniteData<ReviewListResponse> | undefined) =>
        updateInfiniteReviewData(current, (review) =>
          review.id === reviewId ? applyVote(review, null) : review
        )
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(reviewQueryKey(productId, filters), context?.previous);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    }
  });

  const reportMutation = useMutation({
    mutationFn: ({
      reviewId,
      motivo
    }: {
      reviewId: string;
      motivo: "Spam" | "Contenido inapropiado" | "Resena falsa" | "Otro";
    }) => shopService.reportReview(reviewId, motivo),
    onSuccess: async () => {
      await syncQueries();
    }
  });

  const saveReviewMutation = useMutation({
    mutationFn: async ({
      values,
      review
    }: {
      values: {
        calificacion: number;
        titulo: string;
        comentario: string;
        ajuste?: string | null;
        comodidad?: number | null;
        fotos: File[];
        existingPhotoIds: string[];
      };
      review?: Review | null;
    }) =>
      review
        ? shopService.updateReview(review.id, {
            ...values,
            ajuste: values.ajuste ?? undefined,
            comodidad: values.comodidad ?? undefined
          })
        : shopService.createReview(productId, {
            ...values,
            ajuste: values.ajuste ?? undefined,
            comodidad: values.comodidad ?? undefined
          })
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => shopService.deleteReview(reviewId),
    onSuccess: async () => {
      await syncQueries();
    }
  });

  useEffect(() => {
    if (!reviewsQuery.isSuccess) {
      return;
    }

    if (myReviewQuery.data?.item) {
      setPendingReview(null);
    }
  }, [myReviewQuery.data?.item, reviewsQuery.isSuccess]);

  const handleFilterChange = (patch: Partial<ReviewFilters>) => {
    const next = {
      ...parsedFilters,
      ...patch
    };
    const nextParams = reviewFilterToSearchParams({
      ...next,
      estrellas: next.estrellas ?? undefined,
      tipo: next.tipo ?? undefined,
      ajuste: next.ajuste ?? undefined,
      orden: next.orden ?? undefined,
      busqueda: next.busqueda ?? undefined
    });

    setSearchParams(nextParams, { replace: true });
  };

  const handleSubmitReview = async (values: {
    calificacion: number;
    titulo: string;
    comentario: string;
    ajuste?: string | null;
    comodidad?: number | null;
    fotos: File[];
    existingPhotoIds: string[];
  }) => {
    if (!user) {
      return;
    }

    if (!editingReview) {
      setPendingReview({
        id: `optimistic-${Date.now()}`,
        productId,
        userId: user.id,
        calificacion: values.calificacion,
        titulo: values.titulo,
        comentario: values.comentario,
        verificado: true,
        talla: myReviewQuery.data?.elegibilidad.tallaComprada ?? null,
        ajuste: values.ajuste ?? null,
        comodidad: values.comodidad ?? null,
        utilidad: 0,
        visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usuario: buildOptimisticReviewUser(user),
        fotos: values.fotos.map((file, index) => ({
          id: `${file.name}-${index}`,
          url: URL.createObjectURL(file),
          orden: index
        })),
        votos: {
          utiles: 0,
          noUtiles: 0,
          userVote: null
        },
        reportCount: 0,
        respuesta: null
      });
    }

    await saveReviewMutation.mutateAsync({
      values,
      review: editingReview
    });

    setIsFormOpen(false);
    setEditingReview(null);
    setPendingReview(null);
    await syncQueries();
  };

  return (
    <section id="resenas" className="space-y-8">
      <div className="surface space-y-4 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">
          Por que esta seccion es mas robusta
        </p>
        <h2 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
          Resenas que ayudan a comprar con menos incertidumbre
        </h2>
        <p className="max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          El objetivo de este sistema no es coleccionar opiniones perfectas, sino generar confianza.
          Muchos compradores revisan primero las criticas para entender lo peor que podria pasar,
          asi que aqui mostramos contexto, filtros, fotos y resenas positivas y criticas destacadas
          en lugar de esconder lo incomodo.
        </p>
      </div>

      <ResumenCalificaciones
        summary={summary}
        selectedStar={parsedFilters.estrellas ?? null}
        onFiltrarEstrella={(star) => handleFilterChange({ estrellas: star })}
      />

      <FiltrosResenas
        filters={parsedFilters}
        total={reviewsQuery.data?.pages[0]?.total ?? 0}
        onChange={handleFilterChange}
      />

      <section className="surface space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">
              Tu experiencia
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Solo clientes con cuenta verificada y una orden entregada pueden dejar una resena.
            </p>
          </div>
          <BotonEscribirResena
            user={user}
            eligibility={myReviewQuery.data?.elegibilidad ?? null}
            myReview={myReviewQuery.data?.item ?? null}
            isOpen={isFormOpen}
            onToggle={() => {
              setEditingReview(myReviewQuery.data?.item ?? null);
              setIsFormOpen((current) => !current);
            }}
          />
        </div>

        {myReviewQuery.data?.elegibilidad.razon ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {myReviewQuery.data.elegibilidad.razon}
          </p>
        ) : null}

        {isFormOpen ? (
          <FormularioResena
            initialReview={editingReview ?? myReviewQuery.data?.item ?? null}
            purchasedSize={myReviewQuery.data?.elegibilidad.tallaComprada ?? null}
            onSubmit={handleSubmitReview}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingReview(null);
            }}
            isSubmitting={saveReviewMutation.isPending}
          />
        ) : null}
      </section>

      <ResenasDestacadas
        positiva={featuredPositive}
        critica={featuredCritical}
        onVote={(reviewId, util) => voteMutation.mutate({ reviewId, util })}
        onRemoveVote={(reviewId) => removeVoteMutation.mutate(reviewId)}
        onReport={(reviewId, motivo) => reportMutation.mutate({ reviewId, motivo })}
        onOpenGallery={(photos, index) => setLightbox({ photos, index })}
      />

      <ListaResenas
        reviews={displayedReviews}
        isOwner={(review) => review.userId === user?.id}
        onVote={(reviewId, util) => voteMutation.mutate({ reviewId, util })}
        onRemoveVote={(reviewId) => removeVoteMutation.mutate(reviewId)}
        onReport={(reviewId, motivo) => reportMutation.mutate({ reviewId, motivo })}
        onEdit={(review) => {
          setEditingReview(review);
          setIsFormOpen(true);
        }}
        onDelete={(review) => {
          if (window.confirm("Quieres eliminar tu resena?")) {
            deleteReviewMutation.mutate(review.id);
          }
        }}
        onOpenGallery={(photos, index) => setLightbox({ photos, index })}
        emptyTitle="Se el primero en resenar este producto"
        emptyDescription="Comparte lo bueno y lo mejorable para ayudar a quienes estan evaluando comprar."
      />

      {displayedReviews.length > 0 ? (
        <div className="flex justify-center">
          <BotonCargarMas
            hasMore={Boolean(reviewsQuery.hasNextPage)}
            isLoading={reviewsQuery.isFetchingNextPage}
            onClick={() => void reviewsQuery.fetchNextPage()}
          />
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={18} />
          </button>
          <button
            type="button"
            className="absolute left-5 rounded-full bg-white/10 p-3 text-white"
            onClick={() =>
              setLightbox((current) =>
                current
                  ? {
                      ...current,
                      index:
                        current.index === 0 ? current.photos.length - 1 : current.index - 1
                    }
                  : current
              )
            }
          >
            <ChevronLeft size={18} />
          </button>
          <img
            src={lightbox.photos[lightbox.index]?.url}
            alt=""
            className="max-h-[82vh] max-w-[82vw] rounded-[2rem] object-contain"
          />
          <button
            type="button"
            className="absolute right-5 rounded-full bg-white/10 p-3 text-white"
            onClick={() =>
              setLightbox((current) =>
                current
                  ? {
                      ...current,
                      index:
                        current.index === current.photos.length - 1 ? 0 : current.index + 1
                    }
                  : current
              )
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
};
