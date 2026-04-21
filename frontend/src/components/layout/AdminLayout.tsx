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

import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/ordenes", label: "Órdenes", icon: Layers3 },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/sub-admins", label: "Sub-admins", icon: Shield },
  { to: "/admin/etiquetas", label: "Etiquetas", icon: Tags },
  { to: "/admin/cupones", label: "Cupones", icon: BadgeDollarSign },
  { to: "/admin/resenas", label: "Resenas", icon: MessageSquareQuote },
  { to: "/admin/resenas/reportadas", label: "Reportadas", icon: Siren },
  { to: "/admin/blog", label: "Blog", icon: Newspaper }
];

export const AdminLayout = () => (
  <div className="page-shell grid gap-6 lg:grid-cols-[300px_1fr]">
    <aside className="surface h-fit p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-ember">
        Control room
      </p>
      <nav className="space-y-2">
        {links.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition dark:text-slate-300",
                isActive && "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
    <div className="space-y-6">
      <Outlet />
    </div>
  </div>
);
