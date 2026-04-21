import type { BoldCheckoutConfig } from "@/types/api";

declare global {
  interface Window {
    BoldCheckout?: {
      mount: (config: BoldCheckoutConfig) => { open: () => void };
    };
  }
}

const scriptUrl =
  import.meta.env.VITE_BOLD_SCRIPT_URL ?? "https://checkout.bold.co/library/boldPaymentButton.js";

export const loadBoldScript = async () => {
  if (window.BoldCheckout) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Bold")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Bold"));
    document.body.appendChild(script);
  });
};

export const openBoldCheckout = async (config: BoldCheckoutConfig) => {
  await loadBoldScript();

  if (!window.BoldCheckout) {
    throw new Error("Bold Checkout no está disponible");
  }

  const instance = window.BoldCheckout.mount(config);
  instance.open();
};
