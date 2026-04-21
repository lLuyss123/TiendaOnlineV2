import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ratingLabel } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/api";

import { EstrellasPuntuacion } from "./EstrellasPuntuacion";

const reviewFormSchema = z.object({
  calificacion: z.number().int().min(1, "Selecciona una calificacion").max(5),
  titulo: z.string().min(3).max(100),
  comentario: z.string().min(20).max(1000),
  ajuste: z.enum(["Pequeno", "Exacto", "Grande"]).optional().nullable(),
  comodidad: z.number().int().min(1).max(5).optional().nullable()
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const filePreview = (file: File) => ({
  id: `${file.name}-${file.size}-${file.lastModified}`,
  url: URL.createObjectURL(file),
  file
});

export const FormularioResena = ({
  initialReview,
  purchasedSize,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  initialReview?: Review | null;
  purchasedSize?: string | null;
  onSubmit: (
    payload: ReviewFormValues & {
      fotos: File[];
      existingPhotoIds: string[];
    }
  ) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [newFiles, setNewFiles] = useState<Array<{ id: string; url: string; file: File }>>([]);
  const [existingPhotos, setExistingPhotos] = useState(initialReview?.fotos ?? []);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    handleSubmit,
    control,
    register,
    setValue,
    formState: { errors }
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      calificacion: initialReview?.calificacion ?? 0,
      titulo: initialReview?.titulo ?? "",
      comentario: initialReview?.comentario ?? "",
      ajuste: (initialReview?.ajuste as ReviewFormValues["ajuste"]) ?? null,
      comodidad: initialReview?.comodidad ?? null
    }
  });

  const rating = useWatch({ control, name: "calificacion" });
  const title = useWatch({ control, name: "titulo" }) ?? "";
  const comment = useWatch({ control, name: "comentario" }) ?? "";
  const fit = useWatch({ control, name: "ajuste" });
  const comfort = useWatch({ control, name: "comodidad" });
  const titleRegister = register("titulo");
  const commentRegister = register("comentario");

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [comment]);

  useEffect(() => {
    return () => {
      newFiles.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [newFiles]);

  return (
    <form
      className="surface space-y-6 p-6 md:p-8"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          ajuste: values.ajuste ?? undefined,
          comodidad: values.comodidad ?? undefined,
          fotos: newFiles.map((item) => item.file),
          existingPhotoIds: existingPhotos.map((photo) => photo.id)
        });
      })}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">
          {initialReview ? "Edita tu resena" : "Escribe tu resena"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Las resenas equilibradas ayudan a otros compradores a tomar una decision con mas contexto.
        </p>
      </div>

      <div className="space-y-3">
        <input type="hidden" {...register("calificacion", { valueAsNumber: true })} />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Calificacion</p>
        <EstrellasPuntuacion
          value={hoveredRating ?? rating}
          size="lg"
          interactive
          onChange={(value) => setValue("calificacion", value, { shouldValidate: true })}
          onHoverChange={setHoveredRating}
        />
        <p className="text-sm text-slate-500 dark:text-slate-300">{ratingLabel(hoveredRating ?? rating)}</p>
        {errors.calificacion ? <p className="text-sm text-red-500">{errors.calificacion.message}</p> : null}
      </div>

      <label className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Titulo</span>
          <span className="text-xs text-slate-400">{title.length}/100</span>
        </div>
        <input
          {...titleRegister}
          maxLength={100}
          placeholder="Resume tu experiencia en pocas palabras"
          className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm outline-none transition focus:border-ember dark:border-white/10 dark:bg-white/5"
        />
        {errors.titulo ? <p className="text-sm text-red-500">{errors.titulo.message}</p> : null}
      </label>

      <label className="block space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Comentario</span>
          <span className="text-xs text-slate-400">{comment.length}/1000</span>
        </div>
        <textarea
          {...commentRegister}
          ref={(element) => {
            commentRegister.ref(element);
            textareaRef.current = element;
          }}
          maxLength={1000}
          rows={5}
          placeholder="Cuentanos como fue tu experiencia con el producto..."
          className="min-h-[132px] w-full resize-none overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-4 text-sm outline-none transition focus:border-ember dark:border-white/10 dark:bg-white/5"
        />
        {errors.comentario ? <p className="text-sm text-red-500">{errors.comentario.message}</p> : null}
      </label>

      <div className="space-y-3">
        <input type="hidden" {...register("ajuste")} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ajuste de talla</span>
          {purchasedSize ? (
            <span className="text-xs text-slate-400">Tu talla comprada: {purchasedSize}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Pequeno", "Exacto", "Grande"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setValue("ajuste", fit === option ? null : option)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                fit === option
                  ? "border-ember bg-ember text-white"
                  : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input type="hidden" {...register("comodidad", { valueAsNumber: true })} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Comodidad</span>
          <span className="text-xs text-slate-400">Opcional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("comodidad", comfort === value ? null : value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                comfort === value
                  ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950"
                  : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
              )}
            >
              {value}★
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fotos</span>
          <span className="text-xs text-slate-400">JPG, PNG o WEBP · max 5</span>
        </div>
        <label className="block cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center text-sm text-slate-500 transition hover:border-ember hover:text-ember dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Arrastra fotos aqui o haz clic para seleccionarlas
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 5 - newFiles.length));
              const next = files
                .filter((file) => file.size <= 5 * 1024 * 1024)
                .map((file) => filePreview(file));

              setNewFiles((current) => [...current, ...next].slice(0, 5));
            }}
          />
        </label>

        {existingPhotos.length || newFiles.length ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 dark:border-white/10">
                <img src={photo.url} alt="" className="h-24 w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1 text-white"
                  onClick={() => setExistingPhotos((current) => current.filter((item) => item.id !== photo.id))}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {newFiles.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 dark:border-white/10">
                <img src={item.url} alt="" className="h-24 w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1 text-white"
                  onClick={() => {
                    URL.revokeObjectURL(item.url);
                    setNewFiles((current) => current.filter((currentItem) => currentItem.id !== item.id));
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {isSubmitting ? (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-ember" />
          </div>
          <p className="text-xs text-slate-400">Subiendo fotos y guardando tu resena...</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#ff5b3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ef4d2e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Guardando..." : initialReview ? "Actualizar resena" : "Enviar resena"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
};
