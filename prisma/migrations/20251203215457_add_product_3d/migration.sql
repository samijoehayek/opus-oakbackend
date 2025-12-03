-- CreateEnum
CREATE TYPE "ModelFormat" AS ENUM ('GLB', 'GLTF', 'FBX', 'OBJ', 'USDZ');

-- CreateEnum
CREATE TYPE "EnvironmentPreset" AS ENUM ('STUDIO', 'APARTMENT', 'CITY', 'DAWN', 'FOREST', 'LOBBY', 'NIGHT', 'PARK', 'SUNSET', 'WAREHOUSE');

-- CreateTable
CREATE TABLE "product_models" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "low_poly_url" TEXT NOT NULL,
    "high_poly_url" TEXT,
    "format" "ModelFormat" NOT NULL DEFAULT 'GLB',
    "file_size_low_poly" INTEGER,
    "file_size_high_poly" INTEGER,
    "poster_url" TEXT,
    "environment_preset" "EnvironmentPreset" NOT NULL DEFAULT 'STUDIO',
    "background_color" TEXT,
    "camera_position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "camera_position_y" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "camera_position_z" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "camera_target_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "camera_target_y" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "camera_target_z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "auto_rotate" BOOLEAN NOT NULL DEFAULT true,
    "auto_rotate_speed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "enable_zoom" BOOLEAN NOT NULL DEFAULT true,
    "enable_pan" BOOLEAN NOT NULL DEFAULT true,
    "min_distance" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "max_distance" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_models_product_id_key" ON "product_models"("product_id");

-- AddForeignKey
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
