import { Moon, ShoppingBag, Sun, User2 } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

export const Navbar = ({
  theme,
  onToggleTheme
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#091221]/80">
      <div className="page-shell flex items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-3xl bg-ember px-4 py-2 font-display text-2xl uppercase text-white">
            SportStore
          </div>
          <div className="hidden text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300 md:block">
            ALO / Adidas / Nike
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 dark:text-slate-100 lg:flex">
          {[
            ["/productos", "Catálogo"],
            ["/lookbook", "Lookbook"],
            ["/blog", "Blog"],
            ["/contacto", "Contacto"]
          ].map(([href, label]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) => cn(isActive && "text-ember")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Tooltip label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
            <button
              aria-label={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              onClick={onToggleTheme}
              className="rounded-full border border-slate-200 bg-white/90 p-3 text-slate-700 transition hover:-translate-y-0.5 hover:border-ember hover:text-ember dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-ember"
              type="button"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </Tooltip>
          <Tooltip label={cartCount > 0 ? `Mi carrito (${cartCount})` : "Mi carrito"}>
            <Link
              to="/carrito"
              aria-label="Mi carrito"
              className="relative rounded-full border border-slate-200 bg-white/90 p-3 text-slate-700 transition hover:-translate-y-0.5 hover:border-ember hover:text-ember dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-ember"
            >
              <ShoppingBag size={16} />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Tooltip>
          {user ? (
            <>
              <Tooltip label={user.rol === "CLIENTE" ? "Mi cuenta" : "Panel de administracion"}>
                <Link
                  to={user.rol === "CLIENTE" ? "/cuenta" : "/admin"}
                  aria-label={user.rol === "CLIENTE" ? "Mi cuenta" : "Panel de administracion"}
                  className="rounded-full border border-slate-200 bg-white/90 p-3 text-slate-700 transition hover:-translate-y-0.5 hover:border-ember hover:text-ember dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-ember"
                >
                  <User2 size={16} />
                </Link>
              </Tooltip>
              <Button variant="ghost" onClick={() => void logout()}>
                Salir
              </Button>
            </>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/registro">
                <Button>Crear cuenta</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
