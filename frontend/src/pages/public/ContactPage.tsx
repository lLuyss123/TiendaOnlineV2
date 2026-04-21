import { Headphones, Instagram, MapPin, MessageCircle } from "lucide-react";

import { Input } from "@/components/ui/Input";

export const ContactPage = () => (
  <div className="page-shell grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
    <section className="surface space-y-5 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Contacto</p>
      <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
        Soporte humano
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Usa este espacio para dudas de pedido, restocks, permisos o configuración técnica.
      </p>
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <MessageCircle size={16} />
          WhatsApp principal: +57 300 000 0000
        </div>
        <div className="flex items-center gap-3">
          <Instagram size={16} />
          Instagram: @sportstore.co
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={16} />
          Bogotá, Colombia
        </div>
        <div className="flex items-center gap-3">
          <Headphones size={16} />
          Lun - Vie / 9:00 - 18:00
        </div>
      </div>
    </section>

    <section className="surface space-y-4 p-8">
      <Input label="Nombre" placeholder="Tu nombre" />
      <Input label="WhatsApp" placeholder="+57 300 000 0000" />
      <Input label="Instagram" placeholder="@tuusuario" />
      <Input label="Mensaje" textarea placeholder="Cuéntanos en qué te ayudamos" />
      <p className="text-sm text-slate-500 dark:text-slate-300">
        El formulario queda listo para conectarse con soporte por WhatsApp o continuar la
        conversación por Instagram si prefieres DM.
      </p>
    </section>
  </div>
);
