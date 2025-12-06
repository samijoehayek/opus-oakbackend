import { Injectable, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, unlinkSync, statSync } from 'fs';

export interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  type: 'image' | 'model';
}

@Injectable()
export class UploadsService {
  private readonly baseUrl: string;
  private readonly uploadPath: string;

  constructor() {
    // In production, this would be your CDN/S3 URL
    this.baseUrl =
      process.env.UPLOADS_BASE_URL || 'http://localhost:3001/uploads';
    this.uploadPath = join(process.cwd(), 'uploads');
  }

  /**
   * Process uploaded file and return metadata
   */
  processUpload(file: Express.Multer.File): UploadedFile {
    const isModel = this.isModelFile(file.filename);
    const folder = isModel ? 'models' : 'images';

    return {
      url: `${this.baseUrl}/${folder}/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      type: isModel ? 'model' : 'image',
    };
  }

  /**
   * Process multiple uploaded files
   */
  processUploads(files: Express.Multer.File[]): UploadedFile[] {
    return files.map((file) => this.processUpload(file));
  }

  /**
   * Delete a file by filename
   */
  deleteFile(filename: string): boolean {
    const isModel = this.isModelFile(filename);
    const folder = isModel ? 'models' : 'images';
    const filePath = join(this.uploadPath, folder, filename);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return true;
    }

    return false;
  }

  /**
   * Delete file by URL
   */
  deleteByUrl(url: string): boolean {
    const filename = url.split('/').pop();
    if (!filename) return false;
    return this.deleteFile(filename);
  }

  /**
   * Get file info
   */
  getFileInfo(filename: string): {
    exists: boolean;
    size?: number;
    path?: string;
  } {
    const isModel = this.isModelFile(filename);
    const folder = isModel ? 'models' : 'images';
    const filePath = join(this.uploadPath, folder, filename);

    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        path: filePath,
      };
    }

    return { exists: false };
  }

  /**
   * Check if file is a 3D model
   */
  private isModelFile(filename: string): boolean {
    const modelExtensions = ['.glb', '.gltf', '.fbx', '.obj', '.usdz'];
    return modelExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  }
}
