import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="mt-16 border-t border-white/30 py-12 dark:border-white/10">
    <div className="page-shell grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
      <div className="space-y-4">
        <p className="font-display text-4xl uppercase text-slate-950 dark:text-white">SportStore</p>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          Tienda deportiva con catálogo premium, checkout Bold, alertas de stock y experiencia
          editorial inspirada en retail de alto nivel.
        </p>
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-white">
          Explora
        </p>
        <Link to="/productos">Catálogo</Link>
        <Link to="/lookbook">Lookbook</Link>
        <Link to="/productos?etiqueta=OFERTA">Ofertas en catálogo</Link>
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-white">
          Ayuda
        </p>
        <Link to="/guia-de-tallas">Guía de tallas</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/contacto">Contacto</Link>
      </div>
    </div>
  </footer>
);
