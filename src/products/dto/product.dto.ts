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
import {
  FurnitureCategory,
  ImageType,
  ReviewStatus,
  RelationType,
} from '@prisma/client';

// ============================================
// NESTED CREATE DTOs
// ============================================

export class CreateProductImageDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ enum: ImageType, default: 'PHOTO' })
  @IsOptional()
  @IsEnum(ImageType)
  type?: ImageType = ImageType.PHOTO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}

export class CreateProductSizeDto {
  @ApiProperty({ example: '3 Seater' })
  @IsString()
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ example: 220 })
  @IsNumber()
  width: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  height: number;

  @ApiProperty({ example: 95 })
  @IsNumber()
  depth: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  seatHeight?: number;

  @ApiPropertyOptional({ example: 140 })
  @IsOptional()
  @IsNumber()
  bedWidth?: number;

  @ApiPropertyOptional({ example: 190 })
  @IsOptional()
  @IsNumber()
  bedLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inStock?: boolean = true;

  @ApiPropertyOptional({ example: '6-8 weeks' })
  @IsOptional()
  @IsString()
  leadTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class CreateFabricDto {
  @ApiProperty({ example: 'Charcoal Grey' })
  @IsString()
  name: string;

  @ApiProperty({ example: '#4A4A4A' })
  @IsString()
  hexColor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textureUrl?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inStock?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}

export class CreateFabricCategoryDto {
  @ApiProperty({ example: 'Cotton' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;

  @ApiPropertyOptional({ type: [CreateFabricDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricDto)
  fabrics?: CreateFabricDto[];
}

export class CreateProductFeatureDto {
  @ApiProperty({ example: 'hammer' })
  @IsString()
  icon: string;

  @ApiProperty({ example: 'Handcrafted' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Made by skilled artisans' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

export class CreateProductSpecificationDto {
  @ApiProperty({ example: 'Frame Material' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'Solid oak' })
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number = 0;
}

// ============================================
// 3D MODEL DTOs
// ============================================

export class CreateProductModelDto {
  @ApiProperty({ example: 'https://cdn.example.com/models/sofa-low.glb' })
  @IsString()
  lowPolyUrl: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/models/sofa-high.glb',
  })
  @IsOptional()
  @IsString()
  highPolyUrl?: string;

  @ApiPropertyOptional({
    enum: ['GLB', 'GLTF', 'FBX', 'OBJ', 'USDZ'],
    default: 'GLB',
  })
  @IsOptional()
  @IsEnum(['GLB', 'GLTF', 'FBX', 'OBJ', 'USDZ'])
  format?: string = 'GLB';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fileSizeLowPoly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fileSizeHighPoly?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/models/sofa-poster.jpg',
  })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional({
    enum: [
      'STUDIO',
      'APARTMENT',
      'CITY',
      'DAWN',
      'FOREST',
      'LOBBY',
      'NIGHT',
      'PARK',
      'SUNSET',
      'WAREHOUSE',
    ],
    default: 'STUDIO',
  })
  @IsOptional()
  @IsString()
  environmentPreset?: string = 'STUDIO';

  @ApiPropertyOptional({ example: '#f5f5f5' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  // Camera position
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  cameraPositionX?: number = 0;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  cameraPositionY?: number = 1;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsNumber()
  cameraPositionZ?: number = 3;

  // Camera target
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  cameraTargetX?: number = 0;

  @ApiPropertyOptional({ default: 0.5 })
  @IsOptional()
  @IsNumber()
  cameraTargetY?: number = 0.5;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  cameraTargetZ?: number = 0;

  // Interaction
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoRotate?: boolean = true;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  autoRotateSpeed?: number = 1;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enableZoom?: boolean = true;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enablePan?: boolean = true;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  minDistance?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  maxDistance?: number = 10;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  scale?: number = 1;
}

export class ProductModelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lowPolyUrl: string;

  @ApiPropertyOptional()
  highPolyUrl?: string;

  @ApiProperty()
  format: string;

  @ApiPropertyOptional()
  fileSizeLowPoly?: number;

  @ApiPropertyOptional()
  fileSizeHighPoly?: number;

  @ApiPropertyOptional()
  posterUrl?: string;

  @ApiProperty()
  environmentPreset: string;

  @ApiPropertyOptional()
  backgroundColor?: string;

  @ApiProperty()
  cameraPosition: {
    x: number;
    y: number;
    z: number;
  };

  @ApiProperty()
  cameraTarget: {
    x: number;
    y: number;
    z: number;
  };

  @ApiProperty()
  controls: {
    autoRotate: boolean;
    autoRotateSpeed: number;
    enableZoom: boolean;
    enablePan: boolean;
    minDistance: number;
    maxDistance: number;
  };

  @ApiProperty()
  scale: number;

  @ApiProperty()
  isActive: boolean;
}

// ============================================
// MAIN CREATE/UPDATE DTOs
// ============================================

export class CreateProductDto {
  @ApiProperty({ example: 'SOF-001' })
  @IsString()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'The Belmont Sofa' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Timeless comfort meets modern elegance' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @ApiProperty({ example: 'A beautifully crafted sofa...' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional({ example: 'Best Seller' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ enum: FurnitureCategory, example: 'SOFAS' })
  @IsEnum(FurnitureCategory)
  category: FurnitureCategory;

  @ApiPropertyOptional({ example: 'Sofa Beds' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  // Dimensions
  @ApiPropertyOptional({ example: 220 })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @IsNumber()
  depth?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
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

  // Delivery & Returns
  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @IsNumber()
  leadTimeDays?: number = 21;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  deliveryPrice?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryInfo?: string;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  returnDays?: number = 14;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  returnInfo?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  warrantyYears?: number = 2;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warrantyInfo?: string;

  // Additional Info
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assembly?: string;

  @ApiPropertyOptional({ example: 'Lebanon' })
  @IsOptional()
  @IsString()
  madeIn?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  careInstructions?: string[];

  // Status
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  // Nested relations
  @ApiPropertyOptional({ type: [CreateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];

  @ApiPropertyOptional({ type: [CreateProductSizeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDto)
  sizes?: CreateProductSizeDto[];

  @ApiPropertyOptional({ type: [CreateFabricCategoryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFabricCategoryDto)
  fabricCategories?: CreateFabricCategoryDto[];

  @ApiPropertyOptional({ type: [CreateProductFeatureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductFeatureDto)
  features?: CreateProductFeatureDto[];

  @ApiPropertyOptional({ type: [CreateProductSpecificationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductSpecificationDto)
  specifications?: CreateProductSpecificationDto[];

  @ApiPropertyOptional({ type: CreateProductModelDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductModelDto)
  model?: CreateProductModelDto;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

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

  @ApiPropertyOptional({
    enum: ['featured', 'price_asc', 'price_desc', 'name_asc', 'newest'],
    default: 'featured',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'newest' =
    'featured';
}

// ============================================
// RESPONSE DTOs
// ============================================

export class ProductImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty({ enum: ImageType })
  type: ImageType;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isPrimary: boolean;
}

export class ProductSizeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  originalPrice?: number;

  @ApiProperty()
  dimensions: {
    width: number;
    height: number;
    depth: number;
    seatHeight?: number;
  };

  @ApiPropertyOptional()
  bedDimensions?: {
    width: number;
    length: number;
  };

  @ApiProperty()
  inStock: boolean;

  @ApiPropertyOptional()
  leadTime?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isDefault: boolean;
}

export class FabricResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  hexColor: string;

  @ApiPropertyOptional()
  textureUrl?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  inStock: boolean;

  @ApiProperty()
  category: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isDefault: boolean;
}

export class FabricCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  sortOrder: number;
}

export class ProductFeatureResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  icon: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;
}

export class ProductSpecificationResponseDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;
}

export class ProductReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  helpful: number;

  @ApiProperty()
  date: string;
}

export class RelatedProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  originalPrice?: number;

  @ApiProperty()
  imageUrl: string;
}

export class ProductDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  tagline?: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  longDescription?: string;

  @ApiPropertyOptional()
  story?: string;

  @ApiPropertyOptional()
  badge?: string;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiProperty()
  basePrice: number;

  @ApiPropertyOptional()
  originalPrice?: number;

  // Images
  @ApiProperty({ type: [ProductImageResponseDto] })
  images: ProductImageResponseDto[];

  // Sizes
  @ApiProperty({ type: [ProductSizeResponseDto] })
  sizes: ProductSizeResponseDto[];

  // Fabrics
  @ApiProperty({ type: [FabricCategoryResponseDto] })
  fabricCategories: FabricCategoryResponseDto[];

  @ApiProperty({ type: [FabricResponseDto] })
  fabrics: FabricResponseDto[];

  // Features & Specs
  @ApiProperty({ type: [ProductFeatureResponseDto] })
  features: ProductFeatureResponseDto[];

  @ApiProperty({ type: [ProductSpecificationResponseDto] })
  specifications: ProductSpecificationResponseDto[];

  @ApiPropertyOptional({ type: ProductModelResponseDto })
  model?: ProductModelResponseDto;

  // Delivery & Returns
  @ApiProperty()
  deliveryInfo: {
    price: number;
    description?: string;
  };

  @ApiProperty()
  returns: {
    days: number;
    description?: string;
  };

  @ApiProperty()
  warranty: {
    years: number;
    description?: string;
  };

  // Additional
  @ApiPropertyOptional()
  assembly?: string;

  @ApiPropertyOptional()
  madeIn?: string;

  @ApiProperty({ type: [String] })
  careInstructions: string[];

  // Reviews
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ type: [ProductReviewResponseDto] })
  reviews: ProductReviewResponseDto[];

  // Related
  @ApiProperty({ type: [RelatedProductResponseDto] })
  relatedProducts: RelatedProductResponseDto[];

  // Badges (from badge field + derived)
  @ApiProperty({ type: [String] })
  badges: string[];

  // Status
  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  leadTimeDays: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// List response (lighter version)
export class ProductListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  tagline?: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  badge?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  basePrice: number;

  @ApiPropertyOptional()
  originalPrice?: number;

  @ApiProperty({ type: [ProductImageResponseDto] })
  images: ProductImageResponseDto[];

  @ApiProperty()
  optionCount: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductListItemResponseDto] })
  products: ProductListItemResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// Category metadata
export class CategoryMetadataDto {
  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  heroImage: string;

  @ApiProperty()
  introTitle: string;

  @ApiProperty()
  introText: string;

  @ApiProperty()
  productCount: number;
}
