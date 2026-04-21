import type { ReviewPhoto } from "@/types/api";

export const GaleriaFotosResena = ({
  photos,
  onOpen
}: {
  photos: ReviewPhoto[];
  onOpen: (photos: ReviewPhoto[], index: number) => void;
}) => {
  if (!photos.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onOpen(photos, index)}
          className="overflow-hidden rounded-[1rem] border border-slate-200 dark:border-white/10"
        >
          <img src={photo.url} alt="" className="h-20 w-20 object-cover" />
        </button>
      ))}
    </div>
  );
};
