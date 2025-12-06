import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import * as uploadsService_1 from './uploads.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class UploadsController {
  constructor(
    private readonly uploadsService: uploadsService_1.UploadsService,
  ) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload a single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): uploadsService_1.UploadedFile {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadsService.processUpload(file);
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): uploadsService_1.UploadedFile[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.uploadsService.processUploads(files);
  }

  @Post('model')
  @ApiOperation({ summary: 'Upload a 3D model file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Model uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  uploadModel(
    @UploadedFile() file: Express.Multer.File,
  ): uploadsService_1.UploadedFile {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadsService.processUpload(file);
  }

  @Delete(':filename')
  @ApiOperation({ summary: 'Delete an uploaded file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  deleteFile(@Param('filename') filename: string): { message: string } {
    const deleted = this.uploadsService.deleteFile(filename);
    if (!deleted) {
      throw new BadRequestException('File not found or already deleted');
    }
    return { message: 'File deleted successfully' };
  }
}
