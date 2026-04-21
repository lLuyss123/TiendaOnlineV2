# SportStore

Monorepo full stack para una tienda online deportiva con:

- `frontend`: React + Vite + TypeScript + TailwindCSS + Framer Motion
- `backend`: Node.js + Express + TypeScript + Prisma ORM
- `database`: Supabase PostgreSQL
- `media`: Cloudinary
- `emails`: Resend
- `payments`: Bold Checkout embebido
- `deploy`: Vercel (frontend) + Render (backend)

## Requisitos

- Node.js 22+
- npm 10+
- Proyecto en Supabase con `DATABASE_URL` y `DIRECT_URL`
- Cuenta en Cloudinary
- Cuenta en Resend
- Llaves de integración de Bold Checkout

## Estructura

```text
sportstore/
├── backend/
├── frontend/
└── .github/workflows/ci.yml
```

## Inicio rápido

1. Instala dependencias:

```bash
npm install
```

2. Crea los archivos de entorno:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Completa las credenciales reales en ambos `.env`.

4. Genera el cliente Prisma y ejecuta migraciones:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Arranca frontend y backend:

```bash
npm run dev
```

## Scripts

- `npm run dev`: frontend y backend en paralelo
- `npm run build`: compila ambas aplicaciones
- `npm run lint`: ejecuta eslint en ambos workspaces
- `npm run typecheck`: validación TypeScript
- `npm run test`: pruebas unitarias
- `npm run prisma:migrate`: migra base de datos
- `npm run prisma:seed`: carga datos de ejemplo

## Variables de entorno

### `backend/.env`

```bash
DATABASE_URL="postgresql://postgres:password@db.example.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.example.supabase.co:5432/postgres"
JWT_SECRET="super-secret-key-with-at-least-32-characters"
JWT_EXPIRES_IN="7d"
RESEND_API_KEY="re_xxxxxxxxx"
EMAIL_FROM="SportStore <no-reply@sportstore.com>"
CLOUDINARY_CLOUD_NAME="cloud-name"
CLOUDINARY_API_KEY="api-key"
CLOUDINARY_API_SECRET="api-secret"
FRONTEND_URL="http://localhost:5173"
BOLD_IDENTITY_KEY="test_identity_key"
BOLD_SECRET_KEY="test_secret_key"
BOLD_WEBHOOK_SIGNATURE="optional-webhook-secret"
NODE_ENV="development"
PORT=3000
```

### `frontend/.env`

```bash
VITE_API_URL="http://localhost:3000"
VITE_BOLD_SCRIPT_URL="https://checkout.bold.co/library/boldPaymentButton.js"
VITE_CLOUDINARY_CLOUD_NAME="cloud-name"
```

## Deploy

### Supabase

1. Crea un proyecto nuevo.
2. Obtén `DATABASE_URL` y `DIRECT_URL`.
3. Ejecuta migraciones con `npx prisma migrate deploy` en producción.

### Render

1. Crea un servicio web apuntando a `backend/`.
2. Usa `render.yaml` o configura:
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start command: `npm run start`
3. Configura las variables de entorno del backend.

### Vercel

1. Importa el repo apuntando a `frontend/`.
2. Configura `VITE_API_URL`.
3. Mantén `vercel.json` para evitar 404 en rutas SPA.

## Bold Checkout

SportStore usa la integración embebida del checkout de Bold. El backend:

- crea la orden en estado `PENDING_PAYMENT`
- genera la firma SHA256 con `orderId + amount + currency + secretKey`
- entrega la configuración al frontend
- recibe el webhook en `/api/payments/bold/webhook`

## Seed incluido

El seed crea:

- 1 `SUPER_ADMIN`
- 1 `SUB_ADMIN`
- 3 clientes verificados
- 12 productos con imágenes demo
- etiquetas, reseñas, cupones y artículos de blog

## CI

El workflow en `.github/workflows/ci.yml` ejecuta:

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
