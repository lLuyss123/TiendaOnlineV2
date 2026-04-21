import { useSearchParams } from "react-router-dom";

import { CatalogExperience } from "@/components/product/CatalogExperience";

export const SearchPage = () => {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";

  return (
    <CatalogExperience
      title={`Buscar: ${q || "todo"}`}
      description="Los resultados combinan coincidencia por nombre, descripción y filtros laterales."
      preset={{ q }}
    />
  );
};
