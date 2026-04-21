-- AlterEnum
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'GESTIONAR_RESENAS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ELIMINAR_RESENAS';

-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN "promedioCalificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "totalResenas" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distribucion1" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distribucion2" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distribucion3" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distribucion4" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "distribucion5" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Review"
  ADD COLUMN "titulo" TEXT NOT NULL DEFAULT 'Resena de cliente',
  ADD COLUMN "talla" TEXT,
  ADD COLUMN "ajuste" TEXT,
  ADD COLUMN "comodidad" INTEGER,
  ADD COLUMN "utilidad" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ReviewPhoto" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "publicId" TEXT,
  "orden" INTEGER NOT NULL,

  CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewVote" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "util" BOOLEAN NOT NULL,

  CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewReply" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "contenido" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewReport" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewReminderJob" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sendAfter" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ReviewReminderJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_userId_key" ON "ReviewVote"("reviewId", "userId");
CREATE UNIQUE INDEX "ReviewReply_reviewId_key" ON "ReviewReply"("reviewId");
CREATE UNIQUE INDEX "ReviewReport_reviewId_userId_key" ON "ReviewReport"("reviewId", "userId");
CREATE UNIQUE INDEX "ReviewReminderJob_orderId_userId_productId_key" ON "ReviewReminderJob"("orderId", "userId", "productId");

-- AddForeignKey
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReminderJob" ADD CONSTRAINT "ReviewReminderJob_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReminderJob" ADD CONSTRAINT "ReviewReminderJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReminderJob" ADD CONSTRAINT "ReviewReminderJob_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill
UPDATE "Review"
SET "titulo" = CONCAT('Resena ', "calificacion", ' estrellas')
WHERE "titulo" = 'Resena de cliente';

WITH review_aggregates AS (
  SELECT
    "productId",
    ROUND(AVG("calificacion")::numeric, 1)::double precision AS promedio,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE "calificacion" = 1)::int AS d1,
    COUNT(*) FILTER (WHERE "calificacion" = 2)::int AS d2,
    COUNT(*) FILTER (WHERE "calificacion" = 3)::int AS d3,
    COUNT(*) FILTER (WHERE "calificacion" = 4)::int AS d4,
    COUNT(*) FILTER (WHERE "calificacion" = 5)::int AS d5
  FROM "Review"
  WHERE "visible" = true
  GROUP BY "productId"
)
UPDATE "Product" AS product
SET
  "promedioCalificacion" = review_aggregates.promedio,
  "totalResenas" = review_aggregates.total,
  "distribucion1" = review_aggregates.d1,
  "distribucion2" = review_aggregates.d2,
  "distribucion3" = review_aggregates.d3,
  "distribucion4" = review_aggregates.d4,
  "distribucion5" = review_aggregates.d5
FROM review_aggregates
WHERE product."id" = review_aggregates."productId";
