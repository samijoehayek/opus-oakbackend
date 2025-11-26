import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FurnitureCategory } from '@prisma/client';

// ============================================
// CREATE / UPDATE DTOs
// ============================================

export class CreateMaterialOptionDto {
  @ApiProperty({ example: 'Oak' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'wood' })
  @IsString()
  type: string; // 'wood', 'fabric', 'metal'

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceModifier?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textureUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class CreateColorOptionDto {
  @ApiProperty({ example: 'Charcoal Grey' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '#333333' })
  @IsString()
  hexCode: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceModifier?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textureUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class CreateProductDto {
  @ApiProperty({ example: 'TBL-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Milano Dining Table' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'Elegant dining table inspired by Italian design...' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'Inspired by the classic Minotti aesthetic...' })
  @IsOptional()
  @IsString()
  story?: string;

  @ApiProperty({ enum: FurnitureCategory, example: 'TABLES' })
  @IsEnum(FurnitureCategory)
  category: FurnitureCategory;

  @ApiProperty({ example: 1600 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  // Dimensions
  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ example: 75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  depth?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  // 3D Model
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelThumbnail?: string;

  // Production
  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  leadTimeDays?: number = 21;

  // Status
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  // Options
  @ApiPropertyOptional({ type: [CreateMaterialOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialOptionDto)
  materialOptions?: CreateMaterialOptionDto[];

  @ApiPropertyOptional({ type: [CreateColorOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateColorOptionDto)
  colorOptions?: CreateColorOptionDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class AddProductImageDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}

// ============================================
// QUERY DTOs
// ============================================

export class ProductQueryDto {
  @ApiPropertyOptional({ enum: FurnitureCategory })
  @IsOptional()
  @IsEnum(FurnitureCategory)
  category?: FurnitureCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['price_asc', 'price_desc', 'name_asc', 'newest'] })
  @IsOptional()
  @IsString()
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest' = 'newest';
}

// ============================================
// RESPONSE DTOs
// ============================================

export class MaterialOptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  priceModifier: number;

  @ApiPropertyOptional()
  textureUrl?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isAvailable: boolean;
}

export class ColorOptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  hexCode: string;

  @ApiProperty()
  priceModifier: number;

  @ApiPropertyOptional()
  textureUrl?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isAvailable: boolean;
}

export class ProductImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isPrimary: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  story?: string;

  @ApiProperty({ enum: FurnitureCategory })
  category: FurnitureCategory;

  @ApiProperty()
  basePrice: number;

  // Dimensions
  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  depth?: number;

  @ApiPropertyOptional()
  weight?: number;

  // 3D Model
  @ApiPropertyOptional()
  modelUrl?: string;

  @ApiPropertyOptional()
  modelThumbnail?: string;

  @ApiProperty()
  leadTimeDays: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  // Relations
  @ApiProperty({ type: [ProductImageResponseDto] })
  images: ProductImageResponseDto[];

  @ApiProperty({ type: [MaterialOptionResponseDto] })
  materialOptions: MaterialOptionResponseDto[];

  @ApiProperty({ type: [ColorOptionResponseDto] })
  colorOptions: ColorOptionResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
