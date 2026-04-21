import { useParams } from "react-router-dom";

import { CatalogExperience } from "@/components/product/CatalogExperience";

const categoryMap: Record<string, string> = {
  calzado: "CALZADO",
  ropa: "ROPA",
  accesorios: "ACCESORIOS",
  equipamiento: "EQUIPAMIENTO"
};

export const CategoryPage = () => {
  const { nombre = "" } = useParams();
  const normalized = categoryMap[nombre.toLowerCase()] ?? nombre.toUpperCase();

  return (
    <CatalogExperience
      title={`Categoría ${normalized}`}
      description="Explora productos por categoría con filtros visuales y estados de stock."
      preset={{ categoria: normalized }}
    />
  );
};
