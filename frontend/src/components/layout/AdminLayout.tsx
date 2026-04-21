import {
  BadgeDollarSign,
  LayoutDashboard,
  Layers3,
  MessageSquareQuote,
  Newspaper,
  Package,
  Siren,
  Shield,
  Tags,
  Users
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/productos", label: "Productos", icon: Package, exact: false },
  { to: "/admin/ordenes", label: "Ordenes", icon: Layers3, exact: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, exact: true, superAdminOnly: true },
  { to: "/admin/sub-admins", label: "Sub-admins", icon: Shield, exact: true, superAdminOnly: true },
  { to: "/admin/etiquetas", label: "Etiquetas", icon: Tags, exact: true },
  { to: "/admin/cupones", label: "Cupones", icon: BadgeDollarSign, exact: true },
  { to: "/admin/resenas", label: "Resenas", icon: MessageSquareQuote, exact: true },
  { to: "/admin/resenas/reportadas", label: "Reportadas", icon: Siren, exact: true },
  { to: "/admin/blog", label: "Blog", icon: Newspaper, exact: true }
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const visibleLinks = links.filter((link) => !(user?.rol === "SUB_ADMIN" && link.superAdminOnly));

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="surface h-fit space-y-5 p-5">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-ember">Control room</p>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">{user?.nombre ?? "Administrador"}</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
              {user?.rol === "SUPER_ADMIN" ? "Super Admin" : "Sub Admin"}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {visibleLinks.map(({ exact, icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5",
                  isActive && "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Button variant="secondary" fullWidth onClick={() => void logout()}>
          Salir
        </Button>
      </aside>
      <div className="space-y-6">
        <Outlet />
      </div>
    </div>
  );
};
