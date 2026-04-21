import { useParams } from "react-router-dom";

import { CatalogExperience } from "@/components/product/CatalogExperience";

export const BrandPage = () => {
  const { nombre = "" } = useParams();
  const normalized = nombre.toUpperCase();

  return (
    <CatalogExperience
      title={`Marca ${normalized}`}
      description={`Selección curada de ${normalized} con enfoque editorial y filtros listos para compra.`}
      preset={{ marca: normalized }}
    />
  );
};
