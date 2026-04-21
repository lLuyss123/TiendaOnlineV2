export type Permission =
  | "VER_PRODUCTOS"
  | "CREAR_PRODUCTOS"
  | "EDITAR_PRODUCTOS"
  | "VER_ORDENES"
  | "GESTIONAR_ORDENES"
  | "VER_USUARIOS"
  | "GESTIONAR_BLOG"
  | "GESTIONAR_CUPONES"
  | "GESTIONAR_RESENAS"
  | "ELIMINAR_RESENAS";

export type Role = "SUPER_ADMIN" | "SUB_ADMIN" | "CLIENTE";

export type User = {
  id: string;
  nombre: string;
  email: string;
  avatar?: string | null;
  telefono?: string | null;
  rol: Role;
  activo: boolean;
  permisos: Permission[];
};

export type Tag = {
  id?: string;
  nombre: string;
  slug?: string;
  color: string;
  icono: string;
  computed?: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string | null;
  publicId?: string | null;
  visible: boolean;
  esPortada: boolean;
  orden: number;
};

export type ReviewPhoto = {
  id: string;
  url: string;
  orden: number;
};

export type ReviewVoteSummary = {
  utiles: number;
  noUtiles: number;
  userVote: boolean | null;
};

export type ReviewReply = {
  id: string;
  contenido: string;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    nombre: string;
    avatar?: string | null;
  } | null;
};

export type ReviewUser = {
  id: string;
  nombre: string;
  nombreCompleto: string;
  iniciales: string;
  avatarColor: {
    background: string;
    foreground: string;
  };
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  calificacion: number;
  titulo: string;
  comentario: string;
  verificado: boolean;
  talla?: string | null;
  ajuste?: string | null;
  comodidad?: number | null;
  utilidad: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  usuario: ReviewUser | null;
  fotos: ReviewPhoto[];
  votos: ReviewVoteSummary;
  reportCount: number;
  respuesta: ReviewReply | null;
};

export type ReviewSummary = {
  promedioCalificacion: number;
  totalResenas: number;
  distribucion: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  majorityVerified: boolean;
  verifiedCount: number;
  ajustePromedio: number | null;
  ajusteEtiqueta: string | null;
  comodidadPromedio: number | null;
};

export type ReviewFilters = {
  estrellas?: number | null;
  tipo?: "fotos" | "verificadas" | null;
  ajuste?: string | null;
  orden?: "recientes" | "utiles" | "alta" | "baja";
  busqueda?: string;
};

export type ReviewListResponse = {
  resenas: Review[];
  total: number;
  pagina: number;
  hayMas: boolean;
  resenaPositivaDestacada: Review | null;
  resenaCriticaDestacada: Review | null;
  resumen: ReviewSummary | null;
  filtrosAplicados: {
    estrellas: number | null;
    tipo: string | null;
    ajuste: string | null;
    orden: "recientes" | "utiles" | "alta" | "baja";
    busqueda: string;
  };
};

export type MyReviewEligibility = {
  puedeResenar: boolean;
  yaEscribio: boolean;
  haComprado: boolean;
  emailVerificado: boolean;
  tallaComprada?: string | null;
  ordenId?: string | null;
  razon?: string | null;
};

export type MyReviewResponse = {
  item: Review | null;
  elegibilidad: MyReviewEligibility;
};

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOferta?: number | null;
  discount?: number | null;
  stock: number;
  marca: "ALO" | "ADIDAS" | "NIKE";
  categoria: "CALZADO" | "ROPA" | "ACCESORIOS" | "EQUIPAMIENTO";
  tallas: string[];
  colores: string[];
  especificaciones: Record<string, string>;
  activo: boolean;
  isSoldOut: boolean;
  promedioCalificacion: number;
  totalResenas: number;
  distribucion1: number;
  distribucion2: number;
  distribucion3: number;
  distribucion4: number;
  distribucion5: number;
  images: ProductImage[];
  tags: Tag[];
  reviews: Review[];
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters?: {
    tags: Tag[];
    marcas: string[];
    categorias: string[];
  };
};

export type BlogPost = {
  id: string;
  slug: string;
  titulo: string;
  excerpt: string;
  contenido: string;
  imagen: string;
  relatedProductIds: string[];
  publicado: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    nombre: string;
    avatar?: string | null;
  };
};

export type CartItem = {
  id: string;
  cantidad: number;
  talla?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
};

export type Address = {
  id: string;
  alias: string;
  destinatario: string;
  telefono: string;
  direccion1: string;
  direccion2?: string | null;
  ciudad: string;
  region: string;
  codigoPostal: string;
  pais: string;
  esPrincipal: boolean;
};

export type Order = {
  id: string;
  reference: string;
  total: number;
  subtotal: number;
  descuento: number;
  envio: number;
  estado: string;
  metodoPago: string;
  boldTransactionId?: string | null;
  boldStatus?: string | null;
  paymentReference?: string | null;
  direccionEnvio: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    cantidad: number;
    talla?: string | null;
    color?: string | null;
    precio: number;
    product?: Product;
  }>;
};

export type Coupon = {
  id: string;
  codigo: string;
  tipo: "PERCENTAGE" | "FIXED_AMOUNT";
  valor: number;
  maxUsos?: number | null;
  usosActuales: number;
  vencimiento?: string | null;
  activo: boolean;
  descripcion?: string | null;
};

export type WishlistItem = {
  id: string;
  product: Product;
};

export type BoldCheckoutConfig = {
  apiKey: string;
  amount: number;
  currency: "COP";
  orderId: string;
  description: string;
  redirectionUrl: string;
  renderMode: "embedded";
  integritySignature: string;
  customerData: {
    email: string;
    fullName: string;
    phone: string;
  };
};

export type AdminStats = {
  kpis: {
    products: number;
    users: number;
    orders: number;
    revenue: number;
  };
  latestOrders: Order[];
};

export type AdminUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  permisos: Permission[];
  createdAt: string;
};

export type AdminReview = Review & {
  product: {
    id: string;
    nombre: string;
    slug: string;
  };
  reportes?: Array<{
    id: string;
    motivo?: string;
    createdAt?: string;
  }>;
};

export type ApiErrorShape = {
  message: string;
  details?: unknown;
  errors?: unknown;
};
