import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import type { MyReviewEligibility, Review, User } from "@/types/api";

export const BotonEscribirResena = ({
  user,
  eligibility,
  myReview,
  isOpen,
  onToggle
}: {
  user: User | null;
  eligibility: MyReviewEligibility | null;
  myReview: Review | null;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  if (!user) {
    return (
      <Link to="/login">
        <Button>Inicia sesion para resenar</Button>
      </Link>
    );
  }

  if (myReview) {
    return (
      <Button variant="secondary" onClick={onToggle}>
        {isOpen ? "Cerrar editor" : "Editar mi resena"}
      </Button>
    );
  }

  if (!eligibility?.puedeResenar) {
    return (
      <Button variant="secondary" disabled title={eligibility?.razon ?? "No disponible"}>
        Solo clientes elegibles pueden resenar
      </Button>
    );
  }

  return (
    <Button onClick={onToggle}>
      {isOpen ? "Cerrar formulario" : "Escribe tu resena"}
    </Button>
  );
};
