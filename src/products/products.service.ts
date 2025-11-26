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
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new product with options
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Product SKU already exists');
    }

    // Generate slug from name
    const slug = this.generateSlug(dto.name);

    // Check slug uniqueness
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
      sortBy = 'newest',
    } = query;

    // Build where clause
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

    // Build order by clause
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      this.getOrderBy(sortBy);

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get products
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

    // Check SKU uniqueness if changed
    if (dto.sku && dto.sku !== existingProduct.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    // Handle slug update if name changed
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
        // Add suffix to make unique
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

    // If this is primary, unset other primaries
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
          take: 1,
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
  ): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: category as any,
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

  private getOrderBy(sortBy: string): Prisma.ProductOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_asc':
        return { basePrice: 'asc' };
      case 'price_desc':
        return { basePrice: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private mapProductToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      description: product.description,
      story: product.story,
      category: product.category,
      basePrice: Number(product.basePrice),
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
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
