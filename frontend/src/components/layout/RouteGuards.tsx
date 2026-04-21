import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState label="Verificando sesión..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.activo && user.rol === "CLIENTE") {
    return <Navigate to="/verificacion-pendiente" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingState label="Cargando panel..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!["SUPER_ADMIN", "SUB_ADMIN"].includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};
