import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env";
import { AppError } from "../lib/errors";

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

const assertCloudinaryConfig = () => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError("Cloudinary no está configurado", 503);
  }
};

export const uploadProductImage = async (fileBuffer: Buffer, filename: string) => {
  assertCloudinaryConfig();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "sportstore/products",
        public_id: filename,
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    upload.end(fileBuffer);
  });
};

export const uploadReviewImage = async (fileBuffer: Buffer, filename: string) => {
  assertCloudinaryConfig();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: "sportstore/reviews",
        public_id: filename,
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    upload.end(fileBuffer);
  });
};

export const deleteProductImage = async (publicId?: string | null) => {
  if (!publicId) return;
  assertCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId);
};

export const deleteReviewImage = async (publicId?: string | null) => {
  if (!publicId) return;
  assertCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId);
};
