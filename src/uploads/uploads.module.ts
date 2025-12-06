import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

// Ensure upload directories exist
const uploadPath = join(process.cwd(), 'uploads');
const imagesPath = join(uploadPath, 'images');
const modelsPath = join(uploadPath, 'models');

[uploadPath, imagesPath, modelsPath].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determine destination based on file type
          const isModel = ['.glb', '.gltf', '.fbx', '.obj', '.usdz'].includes(
            extname(file.originalname).toLowerCase(),
          );
          const dest = isModel ? modelsPath : imagesPath;
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          // Generate unique filename
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = extname(file.originalname).toLowerCase();
          const name = file.originalname
            .replace(ext, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .substring(0, 50);
          cb(null, `${name}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
      },
      fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedImages = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
        const allowedModels = ['.glb', '.gltf', '.fbx', '.obj', '.usdz'];
        const ext = extname(file.originalname).toLowerCase();

        if ([...allowedImages, ...allowedModels].includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${ext} not allowed`), false);
        }
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
