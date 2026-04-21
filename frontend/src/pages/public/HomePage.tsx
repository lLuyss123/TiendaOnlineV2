import { useQuery } from "@tanstack/react-query";
import { ArrowRight, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { ProductCard } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatCard } from "@/components/ui/StatCard";
import { testimonials } from "@/data/marketing";
import { dateTime } from "@/lib/utils";
import { shopService } from "@/services/shop";

export const HomePage = () => {
  const productsQuery = useQuery({
    queryKey: ["home-products"],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: "12" });
      return shopService.listProducts(params);
    }
  });

  const blogQuery = useQuery({
    queryKey: ["home-blog"],
    queryFn: () => shopService.listBlogPosts()
  });

  const products = productsQuery.data?.items ?? [];
  const newDrops = products.slice(0, 4);
  const offers = products.filter((product) => product.tags.some((tag) => tag.nombre === "OFERTA")).slice(0, 4);
  const bestsellers = products.filter((product) => product.tags.some((tag) => tag.nombre === "MAS_VENDIDO")).slice(0, 4);

  return (
    <div className="page-shell space-y-14">
      <section className="surface hero-pattern overflow-hidden p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-ember/20 bg-ember/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-ember">
              <Sparkles size={14} />
              Launch collection 2026
            </div>
            <div className="space-y-4">
              <h1 className="font-display text-7xl uppercase leading-none text-slate-950 dark:text-white md:text-[8rem]">
                Move like
                <span className="block text-ember">premium</span>
              </h1>
              <p className="max-w-xl text-base text-slate-600 dark:text-slate-300">
                SportStore mezcla retail editorial, performance y tecnología para vender prendas,
                calzado y accesorios con una experiencia moderna, rápida y lista para producción.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/productos"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                Explorar catálogo
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/lookbook"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                Ver lookbook
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard label="Marcas" value="3" hint="ALO, Adidas y Nike." />
            <StatCard label="Módulos" value="Full Stack" hint="Auth, checkout, admin y blog." />
            <StatCard
              label="Checkout"
              value="Bold"
              hint="Integración embebida con webhook idempotente."
            />
            <StatCard
              label="Deploy"
              value="CI/CD"
              hint={`Último contenido: ${blogQuery.data?.items[0] ? dateTime(blogQuery.data.items[0].createdAt) : "Próximamente"}`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Nuevos lanzamientos"
          title="Selección destacada"
          description="Productos recientes con enfoque premium, imágenes editorializadas y badges visibles."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {newDrops.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: "ALO",
            description: "Athleisure refinado, capas suaves y tonos calmos.",
            href: "/marca/ALO"
          },
          {
            title: "Adidas",
            description: "Silhuetas utilitarias, training y street sport en equilibrio.",
            href: "/marca/ADIDAS"
          },
          {
            title: "Nike",
            description: "Performance con tensión visual, contraste y energía de carrera.",
            href: "/marca/NIKE"
          }
        ].map((brand, index) => (
          <motion.div
            key={brand.title}
            className="surface space-y-4 p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-ember">Brand edit</p>
            <h3 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
              {brand.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{brand.description}</p>
            <Link to={brand.href} className="text-sm font-semibold text-ember">
              Explorar marca
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Catálogo filtrable"
            title="Las ofertas viven dentro del catálogo"
            description="En vez de separar descuentos en otra sección, el catálogo permite filtrar por oferta, marca, categoría y stock desde una sola experiencia."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
        <div className="surface flex flex-col justify-between p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white dark:bg-white dark:text-slate-950">
              <SlidersHorizontal size={14} />
              Filtro inteligente
            </div>
            <h3 className="font-display text-6xl uppercase leading-none text-slate-950 dark:text-white">
              Una sola entrada para descubrir y comprar
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Si alguien quiere ver solo descuentos, entra al catálogo ya filtrado por `OFERTA`
              y desde ahí puede seguir refinando sin salir a otro apartado redundante.
            </p>
          </div>
          <Link
            to="/productos?etiqueta=OFERTA"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white"
          >
            Ver ofertas en el catálogo
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {bestsellers.length > 0 ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Más vendidos"
            title="Favoritos del momento"
            description="Los productos destacados por tracción aparecen con tratamiento visual especial en el home."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Prueba social"
          title="Clientes que vuelven"
          description="Testimonios, recompra y experiencia de seguimiento por email integrados en la propuesta."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="surface space-y-4 p-6">
              <Star className="text-gold" />
              <p className="text-sm text-slate-600 dark:text-slate-300">“{item.quote}”</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Newsletter</p>
          <h2 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
            Producto, blog y restocks
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Mantente cerca de nuevas cápsulas, descuentos y productos que vuelven al stock.
          </p>
        </div>
        <Link
          to="/registro"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
        >
          Crear cuenta
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};
