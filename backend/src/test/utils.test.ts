import { describe, expect, it } from "vitest";

import { createBoldIntegritySignature } from "../utils/bold";
import { deriveComputedTags, serializeProduct } from "../utils/serializers";

describe("deriveComputedTags", () => {
  it("marks sold out products", () => {
    expect(deriveComputedTags({ stock: 0, precioOferta: null }).map((tag) => tag.nombre)).toContain(
      "AGOTADO"
    );
  });

  it("marks low stock and offer products", () => {
    const tags = deriveComputedTags({ stock: 3, precioOferta: 10000 }).map((tag) => tag.nombre);
    expect(tags).toContain("POCAS_UNIDADES");
    expect(tags).toContain("OFERTA");
  });

  it("does not duplicate persisted and computed tags", () => {
    const product = serializeProduct({
      id: "product-1",
      slug: "nike-pegasus-night",
      nombre: "Nike Pegasus Night",
      descripcion: "Producto demo",
      precio: 350000,
      precioOferta: 299000,
      stock: 8,
      marca: "Nike",
      categoria: "Running",
      tags: [
        {
          tag: {
            id: "tag-1",
            nombre: "OFERTA",
            slug: "oferta",
            color: "#ef4444",
            icono: "badge-percent"
          }
        },
        {
          tag: {
            id: "tag-2",
            nombre: "TEMPORADA",
            slug: "temporada",
            color: "#3b82f6",
            icono: "snowflake"
          }
        }
      ]
    });

    expect(product.tags.map((tag: { nombre: string }) => tag.nombre)).toEqual(["OFERTA", "TEMPORADA"]);
  });
});

describe("createBoldIntegritySignature", () => {
  it("creates a deterministic sha256 signature", () => {
    const signature = createBoldIntegritySignature({
      orderId: "ORD-123",
      amount: 120000,
      currency: "COP",
      secretKey: "test_secret_key"
    });

    expect(signature).toMatch(/^[a-f0-9]{64}$/);
    expect(signature).toBe(
      createBoldIntegritySignature({
        orderId: "ORD-123",
        amount: 120000,
        currency: "COP",
        secretKey: "test_secret_key"
      })
    );
  });
});
