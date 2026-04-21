import { motion } from "framer-motion";

export const SectionHeading = ({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4 }}
    className="max-w-2xl space-y-3"
  >
    <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">{eyebrow}</p>
    <h2 className="font-display text-5xl uppercase leading-none text-slate-950 dark:text-white md:text-6xl">
      {title}
    </h2>
    <p className="text-sm text-slate-600 dark:text-slate-300 md:text-base">{description}</p>
  </motion.div>
);
