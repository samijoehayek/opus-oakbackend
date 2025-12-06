import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    example: 'http://localhost:3001/uploads/images/sofa-123456789.jpg',
  })
  url: string;

  @ApiProperty({ example: 'sofa-123456789.jpg' })
  filename: string;

  @ApiProperty({ example: 'my-sofa-image.jpg' })
  originalName: string;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ enum: ['image', 'model'], example: 'image' })
  type: 'image' | 'model';
}

export class MultipleUploadResponseDto {
  @ApiProperty({ type: [UploadResponseDto] })
  files: UploadResponseDto[];
}

export class DeleteFileResponseDto {
  @ApiProperty({ example: 'File deleted successfully' })
  message: string;
}
