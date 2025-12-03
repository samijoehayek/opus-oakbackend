import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  AddProductImageDto,
  ProductResponseDto,
  ProductListResponseDto,
  CategoryMetadataDto,
} from './dto';
import { Prisma, FurnitureCategory } from '@prisma/client';

// Category metadata configuration
const CATEGORY_METADATA: Record<
  string,
  Omit<CategoryMetadataDto, 'productCount'>
> = {
  SOFAS: {
    slug: 'sofas',
    name: 'Sofas',
    title: 'Sofas',
    description: 'Handcrafted sofas designed for comfort and elegance',
    heroImage:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=1080&fit=crop',
    introTitle: 'The Art of Comfort',
    introText:
      'Our sofas are crafted with meticulous attention to detail, combining traditional craftsmanship with contemporary design. Each piece is made to order, ensuring the perfect fit for your space.',
  },
  BEDS: {
    slug: 'beds',
    name: 'Beds',
    title: 'Beds',
    description: "Luxurious beds for the perfect night's sleep",
    heroImage:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1920&h=1080&fit=crop',
    introTitle: 'Rest in Luxury',
    introText:
      'Experience the pinnacle of bedroom luxury with our handcrafted beds. Each frame is built to last generations, with customizable options to match your unique style.',
  },
  TABLES: {
    slug: 'tables',
    name: 'Tables',
    title: 'Tables',
    description: 'Statement tables for dining and living spaces',
    heroImage:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=1920&h=1080&fit=crop',
    introTitle: 'Gather in Style',
    introText:
      'From intimate dining tables to grand conference pieces, our tables are designed to be the centerpiece of your space. Crafted from the finest materials with impeccable attention to detail.',
  },
  CHAIRS: {
    slug: 'armchairs',
    name: 'Armchairs',
    title: 'Armchairs',
    description: 'Designer armchairs and accent seating',
    heroImage:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1920&h=1080&fit=crop',
    introTitle: 'Sculptural Comfort',
    introText:
      'Our armchairs blend artistic expression with ergonomic design. Each piece is a statement of style, offering both visual appeal and exceptional comfort.',
  },
  ACCESSORIES: {
    slug: 'accessories',
    name: 'Accessories',
    title: 'Accessories',
    description: 'Curated home accessories and decor',
    heroImage:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop',
    introTitle: 'The Finishing Touch',
    introText:
      'Complete your space with our carefully curated collection of home accessories. From lighting to decorative objects, each piece is selected for its quality and design.',
  },
  STORAGE: {
    slug: 'storage',
    name: 'Storage',
    title: 'Storage',
    description: 'Elegant storage solutions for modern living',
    heroImage:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1920&h=1080&fit=crop',
    introTitle: 'Organized Elegance',
    introText:
      'Our storage pieces combine functionality with beauty. Thoughtfully designed to keep your space organized while adding a touch of sophistication.',
  },
  LIGHTING: {
    slug: 'lighting',
    name: 'Lighting',
    title: 'Lighting',
    description: 'Designer lighting for every room',
    heroImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop',
    introTitle: 'Illuminate Your Space',
    introText:
      'Transform any room with our collection of designer lighting. From statement chandeliers to subtle accent lamps, find the perfect light for your space.',
  },
  OUTDOOR: {
    slug: 'outdoor',
    name: 'Outdoor',
    title: 'Outdoor',
    description: 'Premium outdoor furniture collection',
    heroImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop',
    introTitle: 'Outdoor Living',
    introText:
      'Extend your living space outdoors with our weather-resistant collection. Designed to withstand the elements while maintaining the same quality and style as our indoor pieces.',
  },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new product with options
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Product SKU already exists');
    }

    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        'Product slug already exists. Please use a different name.',
      );
    }

    const { materialOptions, colorOptions, ...productData } = dto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        basePrice: new Prisma.Decimal(dto.basePrice),
        originalPrice: dto.originalPrice
          ? new Prisma.Decimal(dto.originalPrice)
          : null,
        width: dto.width ? new Prisma.Decimal(dto.width) : null,
        height: dto.height ? new Prisma.Decimal(dto.height) : null,
        depth: dto.depth ? new Prisma.Decimal(dto.depth) : null,
        weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
        materialOptions: materialOptions?.length
          ? {
              create: materialOptions.map((opt) => ({
                ...opt,
                priceModifier: new Prisma.Decimal(opt.priceModifier || 0),
              })),
            }
          : undefined,
        colorOptions: colorOptions?.length
          ? {
              create: colorOptions.map((opt) => ({
                ...opt,
                priceModifier: new Prisma.Decimal(opt.priceModifier || 0),
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        materialOptions: true,
        colorOptions: true,
      },
    });

    return this.mapProductToResponse(product);
  }

  /**
   * Get all products with filtering and pagination
   */
  async findAll(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const {
      category,
      isFeatured,
      isActive,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'featured',
    } = query;

    const where: Prisma.ProductWhereInput = {
      ...(category && { category }),
      ...(typeof isFeatured === 'boolean' && { isFeatured }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice !== undefined && {
        basePrice: { gte: minPrice },
      }),
      ...(maxPrice !== undefined && {
        basePrice: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          lte: maxPrice,
        },
      }),
    };

    const orderBy = this.getOrderBy(sortBy);
    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        materialOptions: {
          where: { isAvailable: true },
        },
        colorOptions: {
          where: { isAvailable: true },
        },
      },
    });

    return {
      products: products.map((p) => this.mapProductToResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single product by ID or slug
   */
  async findOne(idOrSlug: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        materialOptions: true,
        colorOptions: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapProductToResponse(product);
  }

  /**
   * Update a product
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku && dto.sku !== existingProduct.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    let slug = existingProduct.slug;
    if (dto.name && dto.name !== existingProduct.name) {
      slug = this.generateSlug(dto.name);
      const existingSlug = await this.prisma.product.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const { materialOptions, colorOptions, ...productData } = dto;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        slug,
        ...(dto.basePrice !== undefined && {
          basePrice: new Prisma.Decimal(dto.basePrice),
        }),
        ...(dto.originalPrice !== undefined && {
          originalPrice: dto.originalPrice
            ? new Prisma.Decimal(dto.originalPrice)
            : null,
        }),
        ...(dto.width !== undefined && {
          width: dto.width ? new Prisma.Decimal(dto.width) : null,
        }),
        ...(dto.height !== undefined && {
          height: dto.height ? new Prisma.Decimal(dto.height) : null,
        }),
        ...(dto.depth !== undefined && {
          depth: dto.depth ? new Prisma.Decimal(dto.depth) : null,
        }),
        ...(dto.weight !== undefined && {
          weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
        }),
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        materialOptions: true,
        colorOptions: true,
      },
    });

    return this.mapProductToResponse(product);
  }

  /**
   * Delete a product
   */
  async remove(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Add image to product
   */
  async addImage(
    productId: string,
    dto: AddProductImageDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    await this.prisma.productImage.create({
      data: {
        productId,
        ...dto,
      },
    });

    return this.findOne(productId);
  }

  /**
   * Remove image from product
   */
  async removeImage(
    productId: string,
    imageId: string,
  ): Promise<ProductResponseDto> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    return this.findOne(productId);
  }

  /**
   * Add material option to product
   */
  async addMaterialOption(
    productId: string,
    dto: {
      name: string;
      type: string;
      priceModifier?: number;
      textureUrl?: string;
      isDefault?: boolean;
    },
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.materialOption.create({
      data: {
        productId,
        name: dto.name,
        type: dto.type,
        priceModifier: new Prisma.Decimal(dto.priceModifier || 0),
        textureUrl: dto.textureUrl,
        isDefault: dto.isDefault || false,
      },
    });

    return this.findOne(productId);
  }

  /**
   * Add color option to product
   */
  async addColorOption(
    productId: string,
    dto: {
      name: string;
      hexCode: string;
      priceModifier?: number;
      textureUrl?: string;
      isDefault?: boolean;
    },
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.colorOption.create({
      data: {
        productId,
        name: dto.name,
        hexCode: dto.hexCode,
        priceModifier: new Prisma.Decimal(dto.priceModifier || 0),
        textureUrl: dto.textureUrl,
        isDefault: dto.isDefault || false,
      },
    });

    return this.findOne(productId);
  }

  /**
   * Get featured products (for homepage)
   */
  async getFeatured(limit: number = 8): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        materialOptions: {
          where: { isAvailable: true },
        },
        colorOptions: {
          where: { isAvailable: true },
        },
      },
    });

    return products.map((p) => this.mapProductToResponse(p));
  }

  /**
   * Get products by category
   */
  async getByCategory(
    category: string,
    limit: number = 20,
    sortBy: string = 'featured',
  ): Promise<ProductResponseDto[]> {
    const orderBy = this.getOrderBy(sortBy);

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: category.toUpperCase() as FurnitureCategory,
      },
      take: limit,
      orderBy,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        materialOptions: {
          where: { isAvailable: true },
        },
        colorOptions: {
          where: { isAvailable: true },
        },
      },
    });

    return products.map((p) => this.mapProductToResponse(p));
  }

  /**
   * Get category metadata
   */
  async getCategoryMetadata(
    categorySlug: string,
  ): Promise<CategoryMetadataDto> {
    // Map slug to enum
    const slugToEnum: Record<string, string> = {
      sofas: 'SOFAS',
      beds: 'BEDS',
      tables: 'TABLES',
      armchairs: 'CHAIRS',
      chairs: 'CHAIRS',
      accessories: 'ACCESSORIES',
      storage: 'STORAGE',
      lighting: 'LIGHTING',
      outdoor: 'OUTDOOR',
    };

    const categoryEnum = slugToEnum[categorySlug.toLowerCase()];

    if (!categoryEnum) {
      throw new NotFoundException('Category not found');
    }

    const metadata = CATEGORY_METADATA[categoryEnum];

    if (!metadata) {
      throw new NotFoundException('Category metadata not found');
    }

    // Get product count
    const productCount = await this.prisma.product.count({
      where: {
        isActive: true,
        category: categoryEnum as FurnitureCategory,
      },
    });

    return {
      ...metadata,
      productCount,
    };
  }

  /**
   * Get all categories with metadata
   */
  async getAllCategories(): Promise<CategoryMetadataDto[]> {
    const categories = Object.keys(CATEGORY_METADATA);

    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.prisma.product.count({
          where: {
            isActive: true,
            category: cat as FurnitureCategory,
          },
        });

        return {
          ...CATEGORY_METADATA[cat],
          productCount,
        };
      }),
    );

    return categoriesWithCounts;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getOrderBy(
    sortBy: string,
  ):
    | Prisma.ProductOrderByWithRelationInput
    | Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price_asc':
      case 'price-asc':
        return { basePrice: 'asc' };
      case 'price_desc':
      case 'price-desc':
        return { basePrice: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'featured':
      default:
        // Featured first, then by creation date
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }

  private mapProductToResponse(product: any): ProductResponseDto {
    const optionCount =
      (product.materialOptions?.length || 0) +
      (product.colorOptions?.length || 0);

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      story: product.story,
      badge: product.badge,
      category: product.category,
      basePrice: Number(product.basePrice),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : undefined,
      width: product.width ? Number(product.width) : undefined,
      height: product.height ? Number(product.height) : undefined,
      depth: product.depth ? Number(product.depth) : undefined,
      weight: product.weight ? Number(product.weight) : undefined,
      modelUrl: product.modelUrl,
      modelThumbnail: product.modelThumbnail,
      leadTimeDays: product.leadTimeDays,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      images:
        product.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })) || [],
      materialOptions:
        product.materialOptions?.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          type: opt.type,
          priceModifier: Number(opt.priceModifier),
          textureUrl: opt.textureUrl,
          isDefault: opt.isDefault,
          isAvailable: opt.isAvailable,
        })) || [],
      colorOptions:
        product.colorOptions?.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          hexCode: opt.hexCode,
          priceModifier: Number(opt.priceModifier),
          textureUrl: opt.textureUrl,
          isDefault: opt.isDefault,
          isAvailable: opt.isAvailable,
        })) || [],
      optionCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
