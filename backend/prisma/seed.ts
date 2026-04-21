import {
  CouponType,
  Permission,
  PrismaClient,
  ProductBrand,
  ProductCategory,
  Role
} from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

const imageUrls = (keyword: string) =>
  [
    `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80&${keyword}=1`,
    `https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1200&q=80&${keyword}=2`,
    `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80&${keyword}=3`,
    `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80&${keyword}=4`,
    `https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80&${keyword}=5`
  ].slice(0, 4);

const productSeeds = [
  {
    nombre: "ALO Flow Bra",
    descripcion: "Top de soporte medio con textura suave para entrenamiento y layering premium.",
    precio: 249000,
    precioOferta: 199000,
    stock: 12,
    marca: ProductBrand.ALO,
    categoria: ProductCategory.ROPA,
    tallas: ["XS", "S", "M", "L"],
    colores: ["Bone", "Black"],
    especificaciones: { material: "Nylon stretch", fit: "Slim", uso: "Studio" },
    tags: ["NUEVO", "OFERTA"],
    images: imageUrls("alo-bra")
  },
  {
    nombre: "ALO Recovery Hoodie",
    descripcion: "Hoodie de recuperacion con caida relajada y estetica athleisure editorial.",
    precio: 389000,
    precioOferta: null,
    stock: 4,
    marca: ProductBrand.ALO,
    categoria: ProductCategory.ROPA,
    tallas: ["S", "M", "L"],
    colores: ["Ivory", "Stone"],
    especificaciones: { material: "French terry", fit: "Oversized", uso: "Recovery" },
    tags: ["EXCLUSIVO"],
    images: imageUrls("alo-hoodie")
  },
  {
    nombre: "ALO Studio Tote",
    descripcion: "Bolso de estudio con compartimentos para botella, mat y accesorios esenciales.",
    precio: 279000,
    precioOferta: null,
    stock: 7,
    marca: ProductBrand.ALO,
    categoria: ProductCategory.ACCESORIOS,
    tallas: ["Unica"],
    colores: ["Sand", "Black"],
    especificaciones: { material: "Canvas", fit: "Utility", uso: "Daily" },
    tags: ["TEMPORADA"],
    images: imageUrls("alo-tote")
  },
  {
    nombre: "ALO Align Legging",
    descripcion: "Legging compresivo para movilidad con soporte suave y acabado mate.",
    precio: 319000,
    precioOferta: 279000,
    stock: 0,
    marca: ProductBrand.ALO,
    categoria: ProductCategory.ROPA,
    tallas: ["XS", "S", "M", "L"],
    colores: ["Graphite"],
    especificaciones: { material: "Performance knit", fit: "Second skin", uso: "Yoga" },
    tags: ["OFERTA"],
    images: imageUrls("alo-legging")
  },
  {
    nombre: "Adidas Ultraboost Pulse",
    descripcion: "Tenis de running con retorno de energia y look tecnico para ciudad.",
    precio: 699000,
    precioOferta: 599000,
    stock: 10,
    marca: ProductBrand.ADIDAS,
    categoria: ProductCategory.CALZADO,
    tallas: ["38", "39", "40", "41", "42"],
    colores: ["White", "Solar Red"],
    especificaciones: { material: "Primeknit", fit: "True to size", uso: "Running" },
    tags: ["MAS_VENDIDO", "OFERTA"],
    images: imageUrls("adidas-ultraboost")
  },
  {
    nombre: "Adidas Adizero Jersey",
    descripcion: "Camiseta ligera de secado rapido para sesiones intensas y clima calido.",
    precio: 189000,
    precioOferta: null,
    stock: 6,
    marca: ProductBrand.ADIDAS,
    categoria: ProductCategory.ROPA,
    tallas: ["S", "M", "L", "XL"],
    colores: ["Blue", "White"],
    especificaciones: { material: "HEAT.RDY", fit: "Athletic", uso: "Training" },
    tags: ["NUEVO"],
    images: imageUrls("adidas-jersey")
  },
  {
    nombre: "Adidas Utility Duffel",
    descripcion: "Duffel mediano con base resistente y organizacion para dias de gimnasio.",
    precio: 249000,
    precioOferta: null,
    stock: 3,
    marca: ProductBrand.ADIDAS,
    categoria: ProductCategory.ACCESORIOS,
    tallas: ["Unica"],
    colores: ["Black"],
    especificaciones: { material: "Ripstop", fit: "Medium", uso: "Gym" },
    tags: ["TEMPORADA"],
    images: imageUrls("adidas-duffel")
  },
  {
    nombre: "Adidas Match Ball Pro",
    descripcion: "Balon de entrenamiento con cubierta texturizada y vuelo estable.",
    precio: 159000,
    precioOferta: null,
    stock: 14,
    marca: ProductBrand.ADIDAS,
    categoria: ProductCategory.EQUIPAMIENTO,
    tallas: ["5"],
    colores: ["White", "Black"],
    especificaciones: { material: "TPU", fit: "Reglamentario", uso: "Futbol" },
    tags: ["PROXIMAMENTE"],
    images: imageUrls("adidas-ball")
  },
  {
    nombre: "Nike Pegasus Night",
    descripcion: "Runner versatil con amortiguacion reactiva y presencia nocturna.",
    precio: 649000,
    precioOferta: 569000,
    stock: 9,
    marca: ProductBrand.NIKE,
    categoria: ProductCategory.CALZADO,
    tallas: ["39", "40", "41", "42", "43"],
    colores: ["Black", "Volt"],
    especificaciones: { material: "Engineered mesh", fit: "Responsive", uso: "Daily run" },
    tags: ["MAS_VENDIDO", "OFERTA"],
    images: imageUrls("nike-pegasus")
  },
  {
    nombre: "Nike Tech Fleece Set",
    descripcion: "Conjunto termico de silueta limpia para entrenamiento y calle.",
    precio: 459000,
    precioOferta: null,
    stock: 5,
    marca: ProductBrand.NIKE,
    categoria: ProductCategory.ROPA,
    tallas: ["S", "M", "L"],
    colores: ["Grey", "Black"],
    especificaciones: { material: "Tech fleece", fit: "Structured", uso: "Lifestyle" },
    tags: ["EXCLUSIVO"],
    images: imageUrls("nike-tech")
  },
  {
    nombre: "Nike Training Gloves",
    descripcion: "Guantes con agarre reforzado para fuerza, circuito y estabilidad.",
    precio: 129000,
    precioOferta: null,
    stock: 11,
    marca: ProductBrand.NIKE,
    categoria: ProductCategory.ACCESORIOS,
    tallas: ["S", "M", "L"],
    colores: ["Black"],
    especificaciones: { material: "Grip mesh", fit: "Secure", uso: "Gym" },
    tags: ["NUEVO"],
    images: imageUrls("nike-gloves")
  },
  {
    nombre: "Nike Mobility Mat",
    descripcion: "Mat premium para movilidad, yoga y recuperacion post-entreno.",
    precio: 199000,
    precioOferta: null,
    stock: 8,
    marca: ProductBrand.NIKE,
    categoria: ProductCategory.EQUIPAMIENTO,
    tallas: ["Unica"],
    colores: ["Midnight"],
    especificaciones: { material: "High density foam", fit: "6mm", uso: "Recovery" },
    tags: ["TEMPORADA"],
    images: imageUrls("nike-mat")
  }
];

const clientSeeds = [
  ["Laura Gomez", "laura@sportstore.dev"],
  ["Andres Rojas", "andres@sportstore.dev"],
  ["Camila Pardo", "camila@sportstore.dev"],
  ["Julian Torres", "julian@sportstore.dev"],
  ["Paula Mejia", "paula@sportstore.dev"],
  ["Sebastian Diaz", "sebastian@sportstore.dev"],
  ["Valentina Ruiz", "valentina@sportstore.dev"],
  ["Nicolas Bernal", "nicolas@sportstore.dev"],
  ["Sofia Velez", "sofia@sportstore.dev"],
  ["Daniela Castro", "daniela@sportstore.dev"]
] as const;

const ratingPattern = [5, 4, 5, 3, 2, 4, 1, 5];
const fitPattern = ["Exacto", "Pequeno", "Exacto", "Grande", "Pequeno", "Exacto", "Grande", "Exacto"];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const reviewTitleByRating = (rating: number, productName: string) => {
  switch (rating) {
    case 5:
      return `Supero mis expectativas con ${productName}`;
    case 4:
      return `Muy buena compra, con detalles menores`;
    case 3:
      return `Cumple, pero hay cosas por pulir`;
    case 2:
      return `No termino de convencerme`;
    default:
      return `Esperaba mucho mas del producto`;
  }
};

const reviewCommentByRating = (rating: number, productName: string, fit: string) => {
  switch (rating) {
    case 5:
      return `${productName} se siente muy bien terminado, comodo y consistente en el uso diario. El ajuste me parecio ${fit.toLowerCase()} y las fotos se parecen bastante al producto real.`;
    case 4:
      return `Me gusto la calidad general de ${productName} y lo volveria a comprar. No es perfecto, pero responde bien y el ajuste se sintio ${fit.toLowerCase()} para mi uso.`;
    case 3:
      return `Es un producto correcto y funcional, aunque no me sorprendio tanto como esperaba. El ajuste fue ${fit.toLowerCase()} y hay un par de detalles de acabados que mejoraria.`;
    case 2:
      return `No tuve una mala experiencia total con ${productName}, pero si me costo justificar el precio. El ajuste me resulto ${fit.toLowerCase()} y senti que el rendimiento pudo ser mejor.`;
    default:
      return `Lo compre con expectativas altas y no se cumplieron. En mi caso ${productName} no se sintio tan comodo, el ajuste fue ${fit.toLowerCase()} y no lo recomendaria sin reservas.`;
  }
};

async function recalculateProductMetrics(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      visible: true
    },
    select: {
      calificacion: true
    }
  });

  const totalResenas = reviews.length;
  const promedioCalificacion =
    totalResenas > 0
      ? Math.round(
          (reviews.reduce((accumulator, review) => accumulator + review.calificacion, 0) / totalResenas) * 10
        ) / 10
      : 0;

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  for (const review of reviews) {
    distribution[review.calificacion as 1 | 2 | 3 | 4 | 5] += 1;
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      promedioCalificacion,
      totalResenas,
      distribucion1: distribution[1],
      distribucion2: distribution[2],
      distribucion3: distribution[3],
      distribucion4: distribution[4],
      distribucion5: distribution[5]
    }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("SportStore123!", 10);

  await prisma.$transaction([
    prisma.reviewVote.deleteMany(),
    prisma.reviewReport.deleteMany(),
    prisma.reviewReply.deleteMany(),
    prisma.reviewPhoto.deleteMany(),
    prisma.reviewReminderJob.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productTag.deleteMany(),
    prisma.stockAlert.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.address.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.subAdminPermission.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany()
  ]);

  const tags = await Promise.all(
    [
      ["NUEVO", "#10b981", "sparkles"],
      ["OFERTA", "#ef4444", "badge-percent"],
      ["MAS_VENDIDO", "#d8a63f", "flame"],
      ["EXCLUSIVO", "#8b5cf6", "crown"],
      ["TEMPORADA", "#3b82f6", "snowflake"],
      ["PROXIMAMENTE", "#374151", "clock-3"]
    ].map(([nombre, color, icono]) =>
      prisma.tag.create({
        data: {
          nombre,
          slug: slugify(nombre, { lower: true, strict: true }),
          color,
          icono
        }
      })
    )
  );

  const tagMap = Object.fromEntries(tags.map((tag) => [tag.nombre, tag]));

  const superAdmin = await prisma.user.create({
    data: {
      nombre: "Sara Admin",
      email: "superadmin@sportstore.dev",
      password: passwordHash,
      rol: Role.SUPER_ADMIN,
      activo: true
    }
  });

  const subAdmin = await prisma.user.create({
    data: {
      nombre: "Mateo Ops",
      email: "subadmin@sportstore.dev",
      password: passwordHash,
      rol: Role.SUB_ADMIN,
      activo: true,
      subAdminPermissions: {
        createMany: {
          data: [
            Permission.VER_PRODUCTOS,
            Permission.CREAR_PRODUCTOS,
            Permission.EDITAR_PRODUCTOS,
            Permission.VER_ORDENES,
            Permission.GESTIONAR_ORDENES,
            Permission.GESTIONAR_BLOG,
            Permission.GESTIONAR_CUPONES,
            Permission.GESTIONAR_RESENAS,
            Permission.ELIMINAR_RESENAS
          ].map((permission) => ({
            permission,
            active: true
          }))
        }
      }
    }
  });

  const clients = await Promise.all(
    clientSeeds.map(([nombre, email], index) =>
      prisma.user.create({
        data: {
          nombre,
          email,
          password: passwordHash,
          rol: Role.CLIENTE,
          activo: true,
          addresses: {
            create: {
              alias: index % 2 === 0 ? "Casa" : "Trabajo",
              destinatario: nombre,
              telefono: `30000000${index}`.slice(0, 10),
              direccion1: `Calle ${100 + index} #45-${60 + index}`,
              direccion2: index % 2 === 0 ? "Apto 401" : "Oficina 12",
              ciudad: "Bogota",
              region: "Cundinamarca",
              codigoPostal: `1101${10 + index}`,
              pais: "CO",
              esPrincipal: true
            }
          }
        }
      })
    )
  );

  const addressMap = Object.fromEntries(
    (
      await prisma.address.findMany({
        orderBy: { createdAt: "asc" }
      })
    ).map((address) => [address.userId, address])
  );

  const products = [];

  for (const seed of productSeeds) {
    const product = await prisma.product.create({
      data: {
        slug: slugify(seed.nombre, { lower: true, strict: true }),
        nombre: seed.nombre,
        descripcion: seed.descripcion,
        precio: seed.precio,
        precioOferta: seed.precioOferta,
        stock: seed.stock,
        marca: seed.marca,
        categoria: seed.categoria,
        tallas: seed.tallas,
        colores: seed.colores,
        especificaciones: seed.especificaciones,
        activo: true,
        tags: {
          create: seed.tags.map((name) => ({
            tagId: tagMap[name].id
          }))
        },
        images: {
          create: seed.images.map((url, index) => ({
            url,
            alt: `${seed.nombre} ${index + 1}`,
            esPortada: index === 0,
            orden: index
          }))
        }
      },
      include: {
        images: true
      }
    });

    products.push(product);
  }

  const purchaseMap = new Map<string, { orderId: string; talla: string | null; userId: string; productId: string }>();
  let orderSequence = 1000;

  for (const [productIndex, product] of products.entries()) {
    for (const [reviewerIndex, client] of clients.slice(0, 8).entries()) {
      const talla = product.tallas[Math.min(reviewerIndex % product.tallas.length, product.tallas.length - 1)] ?? null;
      const color = product.colores[Math.min(reviewerIndex % product.colores.length, product.colores.length - 1)] ?? null;
      const linePrice = Number(product.precioOferta ?? product.precio);
      const order = await prisma.order.create({
        data: {
          reference: `ORD-SEED-${orderSequence}`,
          userId: client.id,
          subtotal: linePrice,
          descuento: 0,
          envio: 18000,
          total: linePrice + 18000,
          estado: "DELIVERED",
          direccionEnvio: addressMap[client.id],
          metodoPago: "BOLD",
          paymentReference: `REF-SEED-${orderSequence}`,
          boldStatus: "PAYMENT_APPROVED",
          createdAt: daysAgo(productIndex + reviewerIndex + 12),
          updatedAt: daysAgo(productIndex + reviewerIndex + 7),
          items: {
            create: [
              {
                productId: product.id,
                cantidad: 1,
                talla,
                color,
                precio: linePrice
              }
            ]
          }
        },
        include: {
          items: true
        }
      });

      purchaseMap.set(`${product.id}:${client.id}`, {
        orderId: order.id,
        talla,
        userId: client.id,
        productId: product.id
      });
      orderSequence += 1;
    }
  }

  await prisma.order.create({
    data: {
      reference: `ORD-SEED-${orderSequence}`,
      userId: clients[0].id,
      subtotal: 848000,
      descuento: 50000,
      envio: 18000,
      total: 816000,
      estado: "PAID",
      direccionEnvio: addressMap[clients[0].id],
      metodoPago: "BOLD",
      paymentReference: `REF-SEED-${orderSequence}`,
      boldStatus: "PAYMENT_APPROVED",
      items: {
        create: [
          {
            productId: products[0].id,
            cantidad: 1,
            talla: "S",
            color: "Bone",
            precio: 199000
          },
          {
            productId: products[4].id,
            cantidad: 1,
            talla: "40",
            color: "White",
            precio: 599000
          }
        ]
      }
    }
  });

  const createdReviews = [];

  for (const [productIndex, product] of products.entries()) {
    for (const [reviewerIndex, client] of clients.slice(0, 8).entries()) {
      const rating = ratingPattern[(productIndex + reviewerIndex) % ratingPattern.length];
      const fit = fitPattern[(productIndex + reviewerIndex) % fitPattern.length];
      const purchase = purchaseMap.get(`${product.id}:${client.id}`);
      const review = await prisma.review.create({
        data: {
          userId: client.id,
          productId: product.id,
          calificacion: rating,
          titulo: reviewTitleByRating(rating, product.nombre),
          comentario: reviewCommentByRating(rating, product.nombre, fit),
          verificado: true,
          talla: purchase?.talla ?? null,
          ajuste: fit,
          comodidad: Math.max(1, Math.min(5, rating === 3 ? 4 : rating)),
          utilidad: 0,
          visible: true,
          createdAt: daysAgo(productIndex + reviewerIndex + 9),
          updatedAt: daysAgo(productIndex + reviewerIndex + 4)
        }
      });

      if (productIndex < 4 && reviewerIndex < 2) {
        await prisma.reviewPhoto.createMany({
          data: product.images.slice(0, 2).map((image, index) => ({
            reviewId: review.id,
            url: image.url,
            publicId: null,
            orden: index
          }))
        });
      }

      if (rating <= 2 && productIndex % 3 === 0) {
        await prisma.reviewReply.create({
          data: {
            reviewId: review.id,
            adminId: productIndex % 2 === 0 ? superAdmin.id : subAdmin.id,
            contenido:
              "Gracias por contarnos lo ocurrido. Ya revisamos tu caso con el equipo de producto y estamos ajustando la referencia para las siguientes reposiciones."
          }
        });
      }

      createdReviews.push({
        id: review.id,
        rating,
        authorId: client.id,
        productId: product.id
      });
    }
  }

  for (const [index, review] of createdReviews.entries()) {
    const voters = clients.filter((client) => client.id !== review.authorId);
    const usefulCount = Math.min(voters.length, Math.max(1, 6 - Math.max(0, 5 - review.rating) + (index % 2)));
    const notUsefulCount = Math.min(
      voters.length - usefulCount,
      review.rating <= 2 ? 2 : review.rating === 3 ? 1 : 0
    );

    const usefulVoters = voters.slice(0, usefulCount);
    const notUsefulVoters = voters.slice(usefulCount, usefulCount + notUsefulCount);

    if (usefulVoters.length > 0) {
      await prisma.reviewVote.createMany({
        data: usefulVoters.map((voter) => ({
          reviewId: review.id,
          userId: voter.id,
          util: true
        }))
      });
    }

    if (notUsefulVoters.length > 0) {
      await prisma.reviewVote.createMany({
        data: notUsefulVoters.map((voter) => ({
          reviewId: review.id,
          userId: voter.id,
          util: false
        }))
      });
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        utilidad: usefulVoters.length - notUsefulVoters.length
      }
    });
  }

  const reportedReviews = createdReviews.filter((review) => review.rating <= 2).slice(0, 2);

  for (const [index, review] of reportedReviews.entries()) {
    const reporters = clients.filter((client) => client.id !== review.authorId).slice(0, index + 2);
    await prisma.reviewReport.createMany({
      data: reporters.map((reporter) => ({
        reviewId: review.id,
        userId: reporter.id,
        motivo: index === 0 ? "Contenido inapropiado" : "Otro"
      }))
    });
  }

  for (const product of products) {
    await recalculateProductMetrics(product.id);
  }

  await prisma.wishlistItem.createMany({
    data: [
      { userId: clients[0].id, productId: products[3].id },
      { userId: clients[1].id, productId: products[2].id },
      { userId: clients[2].id, productId: products[9].id },
      { userId: clients[7].id, productId: products[6].id }
    ]
  });

  await prisma.stockAlert.create({
    data: {
      userId: clients[0].id,
      productId: products[3].id
    }
  });

  await prisma.coupon.createMany({
    data: [
      {
        codigo: "SPORT10",
        tipo: CouponType.PERCENTAGE,
        valor: 10,
        maxUsos: 100,
        usosActuales: 0,
        activo: true,
        descripcion: "10% en lanzamientos destacados"
      },
      {
        codigo: "RUN50K",
        tipo: CouponType.FIXED_AMOUNT,
        valor: 50000,
        maxUsos: 50,
        usosActuales: 1,
        activo: true,
        descripcion: "50.000 COP de descuento en compra deportiva"
      }
    ]
  });

  await prisma.blogPost.createMany({
    data: [
      {
        slug: "como-armar-un-lookbook-de-entrenamiento",
        titulo: "Como armar un lookbook de entrenamiento que si convierta",
        excerpt: "Claves para mezclar storytelling visual, performance y producto comprable.",
        contenido:
          "# Como armar un lookbook\n\nCombina narrativa, fotografia y producto en una sola superficie.\n\n## Reglas base\n\n- Prioriza outfits completos.\n- Manten enlaces a productos reales.\n- Usa bloques cortos y accionables.",
        imagen:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
        relatedProductIds: [products[0].id, products[8].id],
        autorId: superAdmin.id,
        publicado: true,
        publishedAt: new Date()
      },
      {
        slug: "guia-rapida-para-elegir-tenis-segun-tu-ritmo",
        titulo: "Guia rapida para elegir tenis segun tu ritmo",
        excerpt: "Una lectura simple para decidir entre amortiguacion, respuesta y uso diario.",
        contenido:
          "# Elige tenis segun tu ritmo\n\nNo todos los runners buscan lo mismo.\n\n## Que revisar\n\n- Estabilidad\n- Retorno de energia\n- Tipo de uso",
        imagen:
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
        relatedProductIds: [products[4].id, products[8].id],
        autorId: subAdmin.id,
        publicado: true,
        publishedAt: new Date()
      }
    ]
  });

  console.info("Seed completado", {
    superAdmin: superAdmin.email,
    subAdmin: subAdmin.email,
    clientes: clients.map((client) => client.email),
    products: products.length,
    reviews: createdReviews.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
