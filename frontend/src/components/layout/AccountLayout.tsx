import { Heart, Home, MapPinned, Package, UserCircle2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

const links = [
  { to: "/cuenta", label: "Resumen", icon: Home },
  { to: "/cuenta/pedidos", label: "Pedidos", icon: Package },
  { to: "/cuenta/wishlist", label: "Wishlist", icon: Heart },
  { to: "/cuenta/perfil", label: "Perfil", icon: UserCircle2 },
  { to: "/cuenta/direcciones", label: "Direcciones", icon: MapPinned }
];

export const AccountLayout = () => (
  <div className="page-shell grid gap-6 lg:grid-cols-[280px_1fr]">
    <aside className="surface h-fit p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-ember">Mi cuenta</p>
      <nav className="space-y-2">
        {links.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/cuenta"}
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
